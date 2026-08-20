import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";

import {
  canSourceThisMonth,
  expectedImagePath,
  fetchWithRetry,
  hasCompleteRightsReview,
  MAX_BATCH_SIZE,
  planBatchReview,
  productionSlugs,
  readJson,
  selectEligibleSpecies,
  successfulRunsInMonth,
  writeJson,
  type Candidate,
  type BatchReviewDecision,
  type SourcingRun,
  type SpeciesRecord,
} from "./core.ts";

const root = process.cwd();
const speciesDir = path.join(root, "public/species");
const masterPath = path.join(root, "data/import/species.master.json");
const assetsPath = path.join(root, "data/images/species-image-assets.json");
const sourcesPath = path.join(root, "data/images/species-image-sources.json");
const candidatesPath = path.join(root, "data/images/species-image-candidates.json");
const runsPath = path.join(root, "data/images/species-image-runs.json");
const reviewDecisionPath = path.join(root, "data/images/species-image-review.json");
const reportDir = path.join(root, "reports/species-images");

type CandidateFile = { schemaVersion: number; candidates: Candidate[] };
type RunsFile = { schemaVersion: number; runs: SourcingRun[] };
type MasterFile = { species: SpeciesRecord[] };
type AssetMap = Record<string, { imageUrl: string; alt: string; status: string }>;
type SourceMap = Record<string, Record<string, unknown>>;

function option(name: string) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function flag(name: string) {
  return process.argv.includes(`--${name}`);
}

async function inspectImage(filePath: string) {
  const stats = fs.statSync(filePath);
  const image = sharp(filePath, { failOn: "error" });
  const metadata = await image.metadata();
  const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let minX = info.width; let minY = info.height; let maxX = -1; let maxY = -1; let foreground = 0; let alphaMin = 255; let alphaMax = 0;
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const alpha = data[(y * info.width + x) * 4 + 3];
      alphaMin = Math.min(alphaMin, alpha); alphaMax = Math.max(alphaMax, alpha);
      if (alpha >= 8) {
        minX = Math.min(minX, x); minY = Math.min(minY, y);
        maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); foreground += 1;
      }
    }
  }
  const margins = maxX < 0 ? null : { left: minX, right: info.width - 1 - maxX, top: minY, bottom: info.height - 1 - maxY };
  const warnings: string[] = [];
  if (metadata.format !== "webp") warnings.push("not-webp");
  if (metadata.width !== metadata.height) warnings.push("not-square");
  if (stats.size > 300 * 1024) warnings.push("oversized");
  const hasTransparentCanvas = metadata.hasAlpha && alphaMin < 255;
  const solidPadding = hasTransparentCanvas ? null : detectOpposingSolidPadding(data, info.width, info.height);
  if (solidPadding) warnings.push("solid-padding");
  if (hasTransparentCanvas && margins && Math.min(...Object.values(margins)) < metadata.width! * 0.025) warnings.push("tight-margin");
  if (hasTransparentCanvas && margins && Math.max(...Object.values(margins)) > metadata.width! * 0.4) warnings.push("large-margin");
  return { path: filePath, bytes: stats.size, format: metadata.format, width: metadata.width, height: metadata.height, hasAlpha: metadata.hasAlpha, alphaMin, alphaMax, margins, solidPadding, foregroundCoverage: foreground / (info.width * info.height), warnings };
}

function detectOpposingSolidPadding(data: Buffer, width: number, height: number) {
  const pixel = (x: number, y: number) => {
    const offset = (y * width + x) * 4;
    return [data[offset], data[offset + 1], data[offset + 2]] as const;
  };
  const similar = (left: readonly number[], right: readonly number[], tolerance = 5) =>
    left.every((value, index) => Math.abs(value - right[index]) <= tolerance);
  const uniformRow = (y: number) => {
    const reference = pixel(0, y);
    for (let x = 1; x < width; x += 1) if (!similar(pixel(x, y), reference)) return null;
    return reference;
  };
  const uniformColumn = (x: number) => {
    const reference = pixel(x, 0);
    for (let y = 1; y < height; y += 1) if (!similar(pixel(x, y), reference)) return null;
    return reference;
  };
  const countBand = (length: number, fromEnd: boolean, line: (index: number) => readonly number[] | null) => {
    let count = 0; let color: readonly number[] | null = null;
    for (let offset = 0; offset < length * 0.45; offset += 1) {
      const current = line(fromEnd ? length - 1 - offset : offset);
      if (!current || (color && !similar(current, color))) break;
      color ??= current; count += 1;
    }
    return { count, color };
  };
  const top = countBand(height, false, uniformRow);
  const bottom = countBand(height, true, uniformRow);
  const left = countBand(width, false, uniformColumn);
  const right = countBand(width, true, uniformColumn);
  const horizontal = top.color && bottom.color && similar(top.color, bottom.color, 10) &&
    top.count >= height * 0.05 && bottom.count >= height * 0.05 &&
    top.count + bottom.count < height * 0.8;
  const vertical = left.color && right.color && similar(left.color, right.color, 10) &&
    left.count >= width * 0.05 && right.count >= width * 0.05 &&
    left.count + right.count < width * 0.8;
  if (horizontal) return { axis: "horizontal", start: top.count, end: bottom.count, color: top.color };
  if (vertical) return { axis: "vertical", start: left.count, end: right.count, color: left.color };
  return null;
}

async function audit() {
  const master = readJson<MasterFile>(masterPath);
  const assets = readJson<AssetMap>(assetsPath);
  const sources = readJson<SourceMap>(sourcesPath);
  const candidateFile = readJson<CandidateFile>(candidatesPath);
  const runFile = readJson<RunsFile>(runsPath);
  const files = fs.readdirSync(speciesDir).filter((name) => fs.statSync(path.join(speciesDir, name)).isFile()).sort();
  const inspections = [];
  for (const name of files) {
    try { inspections.push(await inspectImage(path.join(speciesDir, name))); }
    catch (error) { inspections.push({ path: path.join(speciesDir, name), warnings: ["invalid-image"], error: String(error) }); }
  }
  const slugs = productionSlugs(speciesDir);
  const expected = new Set(master.species.map((item) => item.slug));
  const missing = [...expected].filter((slug) => !slugs.has(slug)).sort();
  const orphaned = [...slugs].filter((slug) => !expected.has(slug)).sort();
  const pathMismatches = master.species.filter((item) => item.image_url !== expectedImagePath(item.slug)).map((item) => ({ slug: item.slug, actual: item.image_url, expected: expectedImagePath(item.slug) }));
  const databaseMissingAssets = master.species.filter((item) => item.image_url === expectedImagePath(item.slug) && !slugs.has(item.slug)).map((item) => ({ slug: item.slug, imageUrl: item.image_url }));
  const licensingGaps = [...slugs].filter((slug) => {
    const source = sources[slug] ?? {};
    return !source.sourceUrl || !(source.creator || source.author) || !source.license || !source.licenseUrl || !source.attribution || source.commercialUseReviewed !== true || source.modificationsReviewed !== true;
  });
  const manifestGaps = [...slugs].filter((slug) => assets[slug]?.imageUrl !== expectedImagePath(slug) || assets[slug]?.status !== "ready");
  const unresolved = candidateFile.candidates.filter((item) => item.status === "unresolved").map((item) => item.slug);
  const reviewPending = candidateFile.candidates.filter((item) => !["published", "rejected", "unresolved"].includes(item.status)).map((item) => ({ slug: item.slug, status: item.status }));
  const eligible = selectEligibleSpecies({ species: master.species, productionSlugs: slugs, candidates: candidateFile.candidates });
  const now = new Date();
  const result = {
    generatedAt: now.toISOString(), totals: { species: expected.size, productionAssets: slugs.size, missing: missing.length },
    placeholder: inspections.find((item) => path.basename(item.path) === "placeholder.webp") ?? null,
    missing, orphaned, pathMismatches, databaseMissingAssets, invalidAssets: inspections.filter((item) => item.warnings.length > 0),
    manifestGaps, licensingGaps, unresolved, reviewPending, eligible: eligible.map((item) => item.slug),
    sourcing: { utcMonth: now.toISOString().slice(0, 7), successfulRuns: successfulRunsInMonth(runFile.runs, now), maximum: 3, allowed: canSourceThisMonth(runFile.runs, now) },
  };
  fs.mkdirSync(reportDir, { recursive: true });
  writeJson(path.join(reportDir, "audit.json"), result);
  const md = [`# Species image audit`, ``, `Generated: ${result.generatedAt}`, ``, `- Species: ${expected.size}`, `- Production assets: ${slugs.size}`, `- Missing: ${missing.length}`, `- Orphaned: ${orphaned.length}`, `- Invalid/warnings: ${result.invalidAssets.length}`, `- Licensing gaps: ${licensingGaps.length}`, `- Review pending: ${reviewPending.length}`, `- Unresolved: ${unresolved.length}`, `- Successful sourcing runs this UTC month: ${result.sourcing.successfulRuns}/3`, ``, `## Missing`, ``, missing.length ? missing.map((slug) => `- ${slug}`).join("\n") : "None.", ``, `## Asset findings`, ``, result.invalidAssets.length ? result.invalidAssets.map((item) => `- ${path.basename(item.path)}: ${item.warnings.join(", ")}`).join("\n") : "None.", ``, `## Licensing gaps`, ``, licensingGaps.length ? licensingGaps.map((slug) => `- ${slug}`).join("\n") : "None.", ``].join("\n");
  fs.writeFileSync(path.join(reportDir, "audit.md"), md);
  console.log(md);
  if (!result.placeholder || result.placeholder.warnings.includes("invalid-image")) process.exitCode = 1;
  return result;
}

async function validateCommand() {
  const target = process.argv[3];
  if (!target) throw new Error("Usage: npm run species-image:validate -- <path>");
  const result = await inspectImage(path.resolve(root, target));
  console.log(JSON.stringify(result, null, 2));
  if (result.warnings.length) process.exitCode = 1;
}

async function prepareFile(inputPath: string, outputPath: string) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const sourceMetadata = await sharp(inputPath, { failOn: "error" }).metadata();
  const preserveTransparentCanvas = sourceMetadata.hasAlpha === true;
  let preparedBase: Buffer;
  if (preserveTransparentCanvas) {
    preparedBase = await sharp(inputPath, { failOn: "error" })
      .rotate()
      .resize(1200, 1200, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
  } else {
    const background = await sharp(inputPath, { failOn: "error" })
      .rotate()
      .resize(1200, 1200, { fit: "cover", position: sharp.strategy.attention })
      .blur(32)
      .modulate({ brightness: 0.72, saturation: 0.75 })
      .png()
      .toBuffer();
    const completeSource = await sharp(inputPath, { failOn: "error" })
      .rotate()
      .resize(1128, 1128, { fit: "inside" })
      .png()
      .toBuffer();
    preparedBase = await sharp(background)
      .composite([{ input: completeSource, gravity: "center" }])
      .png()
      .toBuffer();
  }
  const qualities = [88, 82, 76, 70, 64];
  let result: Awaited<ReturnType<typeof inspectImage>> | null = null;
  for (const quality of qualities) {
    await sharp(preparedBase, { failOn: "error" })
      .webp({ quality, effort: 6 })
      .toFile(outputPath);
    result = await inspectImage(outputPath);
    if (!result.warnings.includes("oversized")) break;
  }
  return result!;
}

async function prepareCommand() {
  const input = process.argv[3]; const slug = process.argv[4] ?? option("slug");
  if (!input || !slug) throw new Error("Usage: npm run species-image:prepare -- <path> <canonical-slug>");
  expectedImagePath(slug);
  const output = path.join(root, "assets/species-candidates", slug, "prepared.webp");
  const result = await prepareFile(path.resolve(root, input), output);
  console.log(JSON.stringify(result, null, 2));
  if (result.warnings.length) process.exitCode = 1;
}

function decodeHtml(value: unknown) {
  return String(value ?? "").replaceAll(/<[^>]*>/g, "").replaceAll("&amp;", "&").replaceAll("&quot;", '"').trim();
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function commonsCandidateScore(title: string, species: SpeciesRecord) {
  const normalizedTitle = title.toLowerCase().replaceAll(/[^a-z0-9]+/g, " ");
  const identityTerms = (species.scientific_name || species.common_name)
    .toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 2);
  const matchingTerms = identityTerms.filter((term) => normalizedTitle.includes(term)).length;
  const obviousNonPhoto = /\b(fmib|drawing|illustration|diagram|plate|stamp|icon|map)\b/.test(normalizedTitle);
  return (matchingTerms * 10) - (obviousNonPhoto ? 100 : 0);
}

async function sourceFromCommons(species: SpeciesRecord) {
  const query = `${species.scientific_name || species.common_name} filetype:bitmap`;
  const url = new URL("https://commons.wikimedia.org/w/api.php");
  url.search = new URLSearchParams({ action: "query", generator: "search", gsrsearch: query, gsrnamespace: "6", gsrlimit: "10", prop: "imageinfo", iiprop: "url|extmetadata", iiurlwidth: "1600", format: "json", origin: "*" }).toString();
  const requestHeaders = { "User-Agent": "GuideMyTankSpeciesImagePipeline/1.0 (https://www.guidemytank.com)" };
  const response = await fetchWithRetry(url, { headers: requestHeaders });
  if (!response.ok) throw new Error(`Commons API returned ${response.status}`);
  const payload = await response.json() as { query?: { pages?: Record<string, { title: string; imageinfo?: Array<{ url: string; thumburl?: string; descriptionurl: string; extmetadata?: Record<string, { value?: string }> }> }> } };
  const pages = Object.values(payload.query?.pages ?? {}).sort((a, b) => {
    const scoreDifference = commonsCandidateScore(b.title, species) - commonsCandidateScore(a.title, species);
    return scoreDifference || a.title.localeCompare(b.title);
  });
  const page = pages.find((item) => item.imageinfo?.[0]?.url);
  if (!page) return null;
  const info = page.imageinfo![0]; const meta = info.extmetadata ?? {};
  const sourceUrl = info.descriptionurl; const downloadUrl = info.thumburl || info.url;
  const extension = new URL(downloadUrl).pathname.split(".").pop()?.toLowerCase() || "img";
  const directory = path.join(root, "assets/species-candidates", species.slug);
  fs.mkdirSync(directory, { recursive: true });
  const sourceAssetPath = path.join(directory, `source.${extension}`);
  const imageResponse = await fetchWithRetry(downloadUrl, { headers: requestHeaders });
  if (!imageResponse.ok) throw new Error(`Image download returned ${imageResponse.status}`);
  fs.writeFileSync(sourceAssetPath, Buffer.from(await imageResponse.arrayBuffer()));
  let status: Candidate["status"] = "needs-editing";
  const preparedAssetPath = path.join(directory, "prepared.webp");
  const prepared = await prepareFile(sourceAssetPath, preparedAssetPath);
  if (!prepared.warnings.length) {
    status = "ready-for-review";
  } else {
    fs.rmSync(preparedAssetPath, { force: true });
  }
  return {
    id: `${species.slug}-${crypto.randomUUID().slice(0, 8)}`, slug: species.slug, status,
    source: "Wikimedia Commons", sourceUrl, creator: decodeHtml(meta.Artist?.value),
    license: decodeHtml(meta.LicenseShortName?.value), licenseUrl: decodeHtml(meta.LicenseUrl?.value),
    attribution: decodeHtml(meta.Credit?.value), commercialUseReviewed: false, modificationsReviewed: false,
    rightsReviewer: "", rightsReviewedAt: null, reviewNotes: "Automated metadata import; human license and species review required.",
    sourceAssetPath: path.relative(root, sourceAssetPath).replaceAll("\\", "/"),
    preparedAssetPath: fs.existsSync(preparedAssetPath) ? path.relative(root, preparedAssetPath).replaceAll("\\", "/") : "",
    sourcedAt: new Date().toISOString(),
  } satisfies Candidate;
}

function writeReviewReport(candidates: Candidate[]) {
  fs.mkdirSync(reportDir, { recursive: true });
  const preparedCount = candidates.filter((item) => item.preparedAssetPath).length;
  const cards = candidates.map((item) => {
    const hasPreparedAsset = Boolean(item.preparedAssetPath);
    const image = `../../${escapeHtml(item.preparedAssetPath || item.sourceAssetPath)}`;
    const preview = hasPreparedAsset
      ? `<h3>Prepared candidate</h3><div class="previews"><div class="light"><img src="${image}"></div><div class="dark"><img src="${image}"></div><div class="checker"><img src="${image}"></div></div><h3>Representative layouts</h3><div class="layouts"><div class="detail"><img src="${image}"></div><div class="table"><img src="${image}"><span>Table thumbnail</span></div><div class="hover"><img src="${image}"></div><div class="builder"><img src="${image}"><span>Aquarium Builder row</span></div></div>`
      : `<h3>Raw source only</h3><p class="warning">Automated preparation did not produce a valid square WebP under the size limit. Manual preparation is required before approval.</p><div class="raw"><img src="${image}"></div>`;
    return `<article><h2>${escapeHtml(item.slug)}</h2>${preview}<dl><dt>Status</dt><dd>${escapeHtml(item.status)}</dd><dt>Source</dt><dd><a href="${escapeHtml(item.sourceUrl)}">${escapeHtml(item.source)}</a></dd><dt>Creator</dt><dd>${escapeHtml(item.creator || "MISSING")}</dd><dt>License</dt><dd>${escapeHtml(item.license || "MISSING")}</dd></dl></article>`;
  }).join("\n");
  fs.writeFileSync(path.join(reportDir, "review.html"), `<!doctype html><meta charset="utf-8"><title>Species image review</title><style>body{font:16px system-ui;max-width:1100px;margin:auto;padding:24px}article{border:1px solid #888;padding:16px;margin:20px 0}.warning{border-left:4px solid #b45309;background:#fffbeb;padding:12px}.raw{display:grid;place-items:center;background:#eee;min-height:20rem}.raw img{display:block;max-width:100%;max-height:38rem}.previews{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.previews div{aspect-ratio:1;display:grid;place-items:center}.previews img{width:90%;height:90%;object-fit:contain}.light{background:#fff}.dark{background:#18202a}.checker{background-color:#fff;background-image:linear-gradient(45deg,#bbb 25%,transparent 25%),linear-gradient(-45deg,#bbb 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#bbb 75%),linear-gradient(-45deg,transparent 75%,#bbb 75%);background-size:24px 24px;background-position:0 0,0 12px,12px -12px,-12px 0}.layouts{display:flex;align-items:center;gap:18px;flex-wrap:wrap}.layouts img{object-fit:contain}.detail img{width:320px;height:240px}.table img{width:40px;height:40px}.hover img{width:160px;height:160px}.builder img{width:40px;height:40px}.table,.builder{display:flex;align-items:center;gap:8px}dl{display:grid;grid-template-columns:9rem 1fr}</style><h1>Species image candidate review</h1><p>Nothing shown here is approved or published. Prepared candidates: ${preparedCount}. Raw sources requiring manual preparation: ${candidates.length - preparedCount}.</p><p>Natural aquarium or neutral backgrounds are allowed. Review species identity, anatomy, crop, image clarity, provenance, attribution, license, and commercial/modification rights.</p>${cards}`);
  const markdownCards = candidates.map((item) => {
    const image = `../../${item.preparedAssetPath || item.sourceAssetPath}`;
    const preparation = item.preparedAssetPath ? "Prepared square WebP" : "Raw source only; preparation required";
    return [
      `## ${item.slug}`,
      "",
      `![${item.slug} candidate](${image})`,
      "",
      `- Preparation: ${preparation}`,
      `- Source: [${item.source}](${item.sourceUrl})`,
      `- Creator: ${item.creator || "MISSING"}`,
      `- License: [${item.license || "MISSING"}](${item.licenseUrl || item.sourceUrl})`,
      `- Attribution: ${item.attribution || "MISSING"}`,
      "",
    ].join("\n");
  }).join("\n");
  fs.writeFileSync(path.join(reportDir, "review.md"), [
    "# Species image candidate review",
    "",
    "Nothing in this report is approved or published yet.",
    "",
    "Review identity, anatomy, crop, clarity, source, creator, attribution, license, and commercial/modification rights. Natural aquarium or neutral backgrounds are allowed. Reject images with solid letterbox bars, misleading content, bad crops, or unclear rights.",
    "",
    "After reviewing every candidate, edit `data/images/species-image-review.json`. Put every slug in either `approved` or `rejected`, include a reason for every rejection, and set `rightsConfirmed` to `true` only after completing the rights review.",
    "",
    markdownCards,
  ].join("\n"));
}

async function sourceCommand() {
  const dryRun = process.argv[3] === "dry-run" || flag("dry-run");
  const positionalLimit = dryRun ? process.argv[4] : process.argv[3];
  const limit = Number(option("limit") ?? positionalLimit ?? MAX_BATCH_SIZE);
  const master = readJson<MasterFile>(masterPath); const candidateFile = readJson<CandidateFile>(candidatesPath); const runFile = readJson<RunsFile>(runsPath);
  const eligible = selectEligibleSpecies({ species: master.species, productionSlugs: productionSlugs(speciesDir), candidates: candidateFile.candidates, limit });
  if (!eligible.length) { console.log("No eligible species need sourcing; audit completed without a sourcing run."); return; }
  if (!dryRun && !canSourceThisMonth(runFile.runs, new Date())) throw new Error("Monthly limit reached: three successful sourcing runs are already recorded for this UTC month.");
  console.log(`Eligible batch (${eligible.length}): ${eligible.map((item) => item.slug).join(", ")}`);
  if (dryRun) return;
  const startedAt = new Date().toISOString(); const sourced: Candidate[] = [];
  for (const species of eligible) {
    try { const candidate = await sourceFromCommons(species); if (candidate) sourced.push(candidate); }
    catch (error) { console.error(`${species.slug}: ${String(error)}`); }
    await new Promise((resolve) => setTimeout(resolve, 750));
  }
  candidateFile.candidates.push(...sourced); writeJson(candidatesPath, candidateFile); writeReviewReport(sourced);
  const completedAt = new Date().toISOString();
  const run = { id: crypto.randomUUID(), startedAt, completedAt, dryRun: false, successfulCandidates: sourced.length, status: sourced.length ? "successful" : "zero-success", slugs: sourced.map((item) => item.slug) } satisfies SourcingRun;
  runFile.runs.push(run);
  writeJson(runsPath, runFile);
  if (sourced.length) {
    const decision: BatchReviewDecision = {
      schemaVersion: 1,
      batchRunId: run.id,
      rightsConfirmed: false,
      approved: [],
      rejected: {},
      replacements: [],
    };
    writeJson(reviewDecisionPath, decision);
  }
  console.log(`Sourced ${sourced.length} candidate(s). No production assets were changed.`);
}

async function applyBatchReviewCommand() {
  const reviewer = process.argv[3] ?? option("reviewer");
  if (!reviewer?.trim()) throw new Error("Usage: npm run species-images:apply-review -- <reviewer>");
  if (!fs.existsSync(reviewDecisionPath)) throw new Error("No species image batch review file exists.");

  const decision = readJson<BatchReviewDecision>(reviewDecisionPath);
  const hasDecisions = decision.approved.length > 0 || Object.keys(decision.rejected).length > 0;
  if (!hasDecisions && !decision.rightsConfirmed) {
    console.log("Batch review is awaiting human decisions; no production files were changed.");
    return;
  }

  const candidateFile = readJson<CandidateFile>(candidatesPath);
  const runFile = readJson<RunsFile>(runsPath);
  const run = runFile.runs.find((item) => item.id === decision.batchRunId);
  if (!run) throw new Error(`Sourcing run not found for batch review: ${decision.batchRunId}`);
  const plan = planBatchReview({ decision, run, candidates: candidateFile.candidates });
  const reviewerName = reviewer.trim();
  const reviewedAt = new Date().toISOString();
  const assets = readJson<AssetMap>(assetsPath);
  const sources = readJson<SourceMap>(sourcesPath);

  for (const candidate of plan.approved) {
    if (candidate.status === "published") continue;
    const source = path.join(root, candidate.preparedAssetPath);
    const target = path.join(speciesDir, `${candidate.slug}.webp`);
    const exists = fs.existsSync(target);
    if (exists && !plan.replacements.has(candidate.slug)) {
      throw new Error(`Production asset exists; explicitly list as a replacement: ${candidate.slug}`);
    }
    if (!exists && plan.replacements.has(candidate.slug)) {
      throw new Error(`Replacement was requested but no production asset exists: ${candidate.slug}`);
    }
    const inspection = await inspectImage(source);
    if (inspection.warnings.length) {
      throw new Error(`Prepared asset failed validation for ${candidate.slug}: ${inspection.warnings.join(", ")}`);
    }
  }

  for (const { candidate, reason } of plan.rejected) {
    candidate.status = "rejected";
    candidate.reviewNotes = reason;
  }
  for (const candidate of plan.approved) {
    if (candidate.status === "published") continue;
    const target = path.join(speciesDir, `${candidate.slug}.webp`);
    fs.copyFileSync(path.join(root, candidate.preparedAssetPath), target);
    candidate.status = "published";
    candidate.commercialUseReviewed = true;
    candidate.modificationsReviewed = true;
    candidate.rightsReviewer = reviewerName;
    candidate.rightsReviewedAt = reviewedAt;
    candidate.reviewNotes = "Approved through explicit batch review; identity, image quality, provenance, and usage rights accepted.";
    assets[candidate.slug] = {
      imageUrl: expectedImagePath(candidate.slug),
      alt: `${candidate.slug.replaceAll("-", " ")} freshwater aquarium species`,
      status: "ready",
    };
    sources[candidate.slug] = {
      source: candidate.source,
      sourceUrl: candidate.sourceUrl,
      creator: candidate.creator,
      license: candidate.license,
      licenseUrl: candidate.licenseUrl,
      attribution: candidate.attribution,
      commercialUseReviewed: true,
      modificationsReviewed: true,
      rightsReviewer: reviewerName,
      rightsReviewedAt: reviewedAt,
      candidateId: candidate.id,
    };
  }
  writeJson(assetsPath, assets);
  writeJson(sourcesPath, sources);
  writeJson(candidatesPath, candidateFile);
  console.log(`Applied batch review by ${reviewerName}: ${plan.approved.length} approved, ${plan.rejected.length} rejected.`);
}

async function approveCommand() {
  const slug = process.argv[3] ?? option("slug"); const reviewer = process.argv[4] ?? option("reviewer"); const replace = process.argv[5] === "replace" || flag("replace");
  if (!slug || !reviewer) throw new Error("Usage: npm run species-image:approve -- <slug> <reviewer> [replace]");
  const candidateFile = readJson<CandidateFile>(candidatesPath); const candidate = candidateFile.candidates.find((item) => item.slug === slug && item.status === "approved");
  if (!candidate) throw new Error("Candidate must be explicitly marked approved in the manifest first.");
  if (!hasCompleteRightsReview(candidate)) throw new Error("Candidate is missing required provenance or commercial/modification-rights review.");
  if (candidate.rightsReviewer !== reviewer) throw new Error("Reviewer must match the recorded rights reviewer.");
  const source = path.join(root, candidate.preparedAssetPath); const target = path.join(speciesDir, `${slug}.webp`);
  const exists = fs.existsSync(target); if (exists && !replace) throw new Error("Production asset exists; pass --replace for an explicit replacement.");
  const inspection = await inspectImage(source); if (inspection.warnings.length) throw new Error(`Prepared asset failed validation: ${inspection.warnings.join(", ")}`);
  fs.copyFileSync(source, target);
  const assets = readJson<AssetMap>(assetsPath); assets[slug] = { imageUrl: expectedImagePath(slug), alt: `${slug.replaceAll("-", " ")} freshwater aquarium species`, status: "ready" }; writeJson(assetsPath, assets);
  const sources = readJson<SourceMap>(sourcesPath); sources[slug] = { source: candidate.source, sourceUrl: candidate.sourceUrl, creator: candidate.creator, license: candidate.license, licenseUrl: candidate.licenseUrl, attribution: candidate.attribution, commercialUseReviewed: true, modificationsReviewed: true, rightsReviewer: reviewer, rightsReviewedAt: candidate.rightsReviewedAt, candidateId: candidate.id }; writeJson(sourcesPath, sources);
  candidate.status = "published"; writeJson(candidatesPath, candidateFile);
  console.log(`${replace ? "Replaced" : "Published"} ${target} after explicit approval by ${reviewer}.`);
}

const command = process.argv[2];
try {
  if (command === "audit") await audit();
  else if (command === "validate") await validateCommand();
  else if (command === "prepare") await prepareCommand();
  else if (command === "source") await sourceCommand();
  else if (command === "apply-review") await applyBatchReviewCommand();
  else if (command === "approve") await approveCommand();
  else throw new Error("Commands: audit | validate <path> | prepare <path> <slug> | source [dry-run] [limit] | apply-review <reviewer> | approve <slug> <reviewer> [replace]");
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1;
}

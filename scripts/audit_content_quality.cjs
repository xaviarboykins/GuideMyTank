/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require("node:fs");
const path = require("node:path");
const { createClient } = require("@supabase/supabase-js");
const { loadLocalEnv } = require("./load_env_file.cjs");

const root = path.resolve(__dirname, "..");
loadLocalEnv(root);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL and key are required.");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function words(value) {
  return String(value || "")
    .replace(/https?:\/\/\S+/g, " ")
    .match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || [];
}

function textFromJson(value, output = []) {
  if (typeof value === "string") output.push(value);
  else if (Array.isArray(value)) {
    for (const item of value) textFromJson(item, output);
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      if (!["imageId", "href", "url", "sourceUrl"].includes(key)) {
        textFromJson(item, output);
      }
    }
  }
  return output;
}

function normalize(value) {
  return words(value).join(" ").toLowerCase();
}

function shingles(value, size = 5) {
  const tokens = normalize(value).split(" ").filter(Boolean);
  const result = new Set();
  for (let index = 0; index <= tokens.length - size; index += 1) {
    result.add(tokens.slice(index, index + size).join(" "));
  }
  return result;
}

function similarity(left, right) {
  const a = shingles(left);
  const b = shingles(right);
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const item of a) if (b.has(item)) intersection += 1;
  return intersection / (a.size + b.size - intersection);
}

function issue(severity, category, pathName, message) {
  return { severity, category, path: pathName, message };
}

function assertResults(results) {
  const failed = results.find((result) => result.error);
  if (failed) throw new Error(`Unable to audit content: ${failed.error.message}`);
}

async function main() {
  const results = await Promise.all([
    supabase.from("care_guides").select("id,title,slug,summary,status,published_at,updated_at,seo_title,meta_description,open_graph_image_id,species_id"),
    supabase.from("care_guide_sections").select("care_guide_id,section_type,heading,content,display_order"),
    supabase.from("care_guide_images").select("care_guide_id,image_id,is_primary"),
    supabase.from("care_guide_sources").select("care_guide_id,source_id"),
    supabase.from("care_guide_related_species").select("care_guide_id,species_id"),
    supabase.from("articles").select("id,title,slug,summary,status,published_at,updated_at,seo_title,meta_description,featured_image_id,open_graph_image_id,content_type"),
    supabase.from("article_sections").select("article_id,block_type,content,display_order"),
    supabase.from("article_images").select("article_id,image_id"),
    supabase.from("article_sources").select("article_id,source_id"),
    supabase.from("article_related_articles").select("article_id,related_article_id"),
    supabase.from("article_related_care_guides").select("article_id,care_guide_id"),
    supabase.from("article_category_assignments").select("article_id,category_id"),
    supabase.from("species").select("id", { count: "exact", head: true }),
  ]);
  assertResults(results);

  const [guidesResult, guideSectionsResult, guideImagesResult, guideSourcesResult, guideRelatedResult, articlesResult, articleSectionsResult, articleImagesResult, articleSourcesResult, articleRelatedResult, articleGuideLinksResult, categoryAssignmentsResult, speciesCountResult] = results;
  const publishedGuides = (guidesResult.data || []).filter((item) => item.status === "published");
  const publishedArticles = (articlesResult.data || []).filter((item) => item.status === "published");
  const issues = [];
  const records = [];

  for (const guide of publishedGuides) {
    const route = `/care-guides/${guide.slug}`;
    const sections = (guideSectionsResult.data || []).filter((item) => item.care_guide_id === guide.id);
    const images = (guideImagesResult.data || []).filter((item) => item.care_guide_id === guide.id);
    const sources = (guideSourcesResult.data || []).filter((item) => item.care_guide_id === guide.id);
    const related = (guideRelatedResult.data || []).filter((item) => item.care_guide_id === guide.id);
    const body = [guide.title, guide.summary, ...sections.flatMap((item) => [item.heading, ...textFromJson(item.content)])].filter(Boolean).join(" ");
    const wordCount = words(body).length;
    records.push({ id: guide.id, route, family: "care-guide", title: guide.title, body, wordCount, sectionCount: sections.length, sourceCount: sources.length, imageCount: images.length, relatedCount: related.length });
    if (wordCount < 900) issues.push(issue(wordCount < 600 ? "high" : "medium", "thin_content", route, `${wordCount} words; GuideMyTank care-guide target is at least 900 substantive words.`));
    if (sections.length < 12) issues.push(issue("medium", "limited_sections", route, `${sections.length} populated sections; comprehensive care guides should normally cover at least 12 care topics.`));
    if (sources.length < 2) issues.push(issue("medium", "limited_sources", route, `${sources.length} attached source; use at least two independent references for substantive husbandry claims.`));
    if (images.length < 2) issues.push(issue("high", "limited_images", route, `${images.length} attached images.`));
    if (!guide.meta_description?.trim()) issues.push(issue("medium", "missing_meta_description", route, "No dedicated meta description."));
    if (!guide.open_graph_image_id) issues.push(issue("low", "missing_open_graph_image", route, "No explicit Open Graph image."));
    if (related.length === 0) issues.push(issue("medium", "missing_structured_relationship", route, "No related-species relationship is stored."));
  }

  for (const article of publishedArticles) {
    const isGuide = article.content_type === "guide";
    const route = isGuide ? `/learning-center/guides/${article.slug}` : `/learning-center/${article.slug}`;
    const sections = (articleSectionsResult.data || []).filter((item) => item.article_id === article.id);
    const images = (articleImagesResult.data || []).filter((item) => item.article_id === article.id);
    const sources = (articleSourcesResult.data || []).filter((item) => item.article_id === article.id);
    const relatedArticles = (articleRelatedResult.data || []).filter((item) => item.article_id === article.id);
    const relatedGuides = (articleGuideLinksResult.data || []).filter((item) => item.article_id === article.id);
    const categories = (categoryAssignmentsResult.data || []).filter((item) => item.article_id === article.id);
    const body = [article.title, article.summary, ...sections.flatMap((item) => textFromJson(item.content))].filter(Boolean).join(" ");
    const wordCount = words(body).length;
    const threshold = isGuide ? 700 : 900;
    records.push({ id: article.id, route, family: isGuide ? "guide" : "article", title: article.title, body, wordCount, sectionCount: sections.length, sourceCount: sources.length, imageCount: images.length, relatedCount: relatedArticles.length + relatedGuides.length });
    if (wordCount < threshold) issues.push(issue(wordCount < 500 ? "high" : "medium", "thin_content", route, `${wordCount} words; GuideMyTank ${isGuide ? "guide" : "editorial"} target is at least ${threshold} substantive words.`));
    if (sections.length < 4) issues.push(issue("medium", "limited_sections", route, `${sections.length} content blocks.`));
    if (sources.length === 0) issues.push(issue("medium", "missing_sources", route, "No source is attached."));
    if (!article.meta_description?.trim()) issues.push(issue("medium", "missing_meta_description", route, "No dedicated meta description."));
    if (!article.featured_image_id) issues.push(issue("low", "missing_featured_image", route, "No featured image."));
    if (!article.open_graph_image_id) issues.push(issue("low", "missing_open_graph_image", route, "No explicit Open Graph image."));
    if (relatedArticles.length + relatedGuides.length === 0) issues.push(issue("medium", "missing_structured_relationship", route, "No related article or care-guide relationship is stored."));
    if (categories.length === 0) issues.push(issue("medium", "missing_category", route, "No category is assigned."));
  }

  for (let left = 0; left < records.length; left += 1) {
    for (let right = left + 1; right < records.length; right += 1) {
      if (records[left].wordCount < 150 || records[right].wordCount < 150) continue;
      const score = similarity(records[left].body, records[right].body);
      if (score >= 0.65) {
        issues.push(issue("high", "near_duplicate", records[left].route, `${Math.round(score * 100)}% five-word-shingle similarity with ${records[right].route}.`));
      }
    }
  }

  const duplicateTitles = new Map();
  for (const record of records) {
    const key = normalize(record.title);
    duplicateTitles.set(key, [...(duplicateTitles.get(key) || []), record.route]);
  }
  for (const routes of duplicateTitles.values()) {
    if (routes.length > 1) {
      for (const route of routes) issues.push(issue("high", "duplicate_title", route, `Title is shared by: ${routes.join(", ")}.`));
    }
  }

  const speciesCount = speciesCountResult.count || 0;
  const canonicalCompatibilityPairs = (speciesCount * (speciesCount - 1)) / 2;
  if (records.length && canonicalCompatibilityPairs / records.length >= 100) {
    issues.push(issue(
      "high",
      "programmatic_surface_dominance",
      "/compatibility",
      `${canonicalCompatibilityPairs} canonical compatibility URLs versus ${records.length} published editorial and care pages. Review indexability using demonstrated demand and editorial validation before treating the entire pair set as an acquisition surface.`,
    ));
  }

  const summary = {
    publishedCareGuides: publishedGuides.length,
    publishedArticles: publishedArticles.filter((item) => item.content_type !== "guide").length,
    publishedGuides: publishedArticles.filter((item) => item.content_type === "guide").length,
    auditedPages: records.length,
    totalWords: records.reduce((sum, item) => sum + item.wordCount, 0),
    canonicalCompatibilityPairs,
    highPriorityIssues: issues.filter((item) => item.severity === "high").length,
    mediumPriorityIssues: issues.filter((item) => item.severity === "medium").length,
    lowPriorityIssues: issues.filter((item) => item.severity === "low").length,
  };
  const report = {
    generatedAt: new Date().toISOString(),
    thresholdsAreEditorialStandardsNotGooglePolicy: true,
    summary,
    pages: records.map((record) => ({
      id: record.id,
      route: record.route,
      family: record.family,
      title: record.title,
      wordCount: record.wordCount,
      sectionCount: record.sectionCount,
      sourceCount: record.sourceCount,
      imageCount: record.imageCount,
      relatedCount: record.relatedCount,
    })),
    issues,
  };
  const directory = path.join(root, "reports", "content");
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, "quality-audit.json"), `${JSON.stringify(report, null, 2)}\n`);

  const severityRank = { high: 0, medium: 1, low: 2 };
  const markdown = [
    "# Content Quality Audit",
    "",
    `Generated ${report.generatedAt}. Thresholds below are GuideMyTank editorial standards, not numeric requirements published by Google.`,
    "",
    "## Summary",
    "",
    `- Published care guides: ${summary.publishedCareGuides}`,
    `- Published editorials: ${summary.publishedArticles}`,
    `- Published comparison/programmatic guides: ${summary.publishedGuides}`,
    `- Audited pages: ${summary.auditedPages}`,
    `- Total words: ${summary.totalWords}`,
    `- Issues: ${summary.highPriorityIssues} high, ${summary.mediumPriorityIssues} medium, ${summary.lowPriorityIssues} low`,
    "",
    "## Page inventory",
    "",
    "| Page | Family | Words | Sections | Sources | Images | Related |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: |",
    ...report.pages.sort((a, b) => a.wordCount - b.wordCount).map((item) => `| ${item.route} | ${item.family} | ${item.wordCount} | ${item.sectionCount} | ${item.sourceCount} | ${item.imageCount} | ${item.relatedCount} |`),
    "",
    "## Findings",
    "",
    ...issues
      .sort((a, b) => severityRank[a.severity] - severityRank[b.severity])
      .map((item) => `- **${item.severity.toUpperCase()} — ${item.category}:** \`${item.path}\` — ${item.message}`),
    "",
  ].join("\n");
  fs.writeFileSync(path.join(directory, "quality-audit.md"), markdown);

  console.log("GuideMyTank content quality audit");
  console.log(`Published pages: ${summary.auditedPages}`);
  console.log(`Total words: ${summary.totalWords}`);
  console.log(`Issues: ${summary.highPriorityIssues} high, ${summary.mediumPriorityIssues} medium, ${summary.lowPriorityIssues} low`);
  console.log(`Report: ${path.join(directory, "quality-audit.md")}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

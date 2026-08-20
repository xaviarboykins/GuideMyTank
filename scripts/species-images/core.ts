import fs from "node:fs";
import path from "node:path";

export const MAX_BATCH_SIZE = 10;
export const MAX_SUCCESSFUL_RUNS_PER_MONTH = 3;
export const PLACEHOLDER_PATH = "/species/placeholder.webp";
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type SpeciesRecord = {
  slug: string;
  common_name: string;
  scientific_name?: string | null;
  image_url?: string | null;
};

export type CandidateStatus =
  | "sourced"
  | "needs-editing"
  | "ready-for-review"
  | "approved"
  | "rejected"
  | "unresolved"
  | "published";

export type Candidate = {
  id: string;
  slug: string;
  status: CandidateStatus;
  source: string;
  sourceUrl: string;
  creator: string;
  license: string;
  licenseUrl: string;
  attribution: string;
  commercialUseReviewed: boolean;
  modificationsReviewed: boolean;
  rightsReviewer: string;
  rightsReviewedAt: string | null;
  reviewNotes: string;
  sourceAssetPath: string;
  preparedAssetPath: string;
  sourcedAt: string;
};

export type SourcingRun = {
  id: string;
  startedAt: string;
  completedAt: string;
  dryRun: boolean;
  successfulCandidates: number;
  status: "dry-run" | "zero-success" | "successful" | "failed";
  slugs: string[];
};

export type BatchReviewDecision = {
  schemaVersion: 1;
  batchRunId: string;
  rightsConfirmed: boolean;
  approved: string[];
  rejected: Record<string, string>;
  replacements: string[];
};

export type BatchReviewPlan = {
  approved: Candidate[];
  rejected: Array<{ candidate: Candidate; reason: string }>;
  replacements: Set<string>;
};

export function normalizeSpeciesSlug(value: string) {
  return value.trim().toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/(^-|-$)/g, "");
}

export function expectedImagePath(slug: string) {
  if (!SLUG_PATTERN.test(slug)) throw new Error(`Invalid canonical species slug: ${slug}`);
  return `/species/${slug}.webp`;
}

export function utcMonth(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) throw new Error("Invalid date");
  return date.toISOString().slice(0, 7);
}

export function successfulRunsInMonth(runs: SourcingRun[], now: Date) {
  const month = utcMonth(now);
  return runs.filter((run) => run.status === "successful" && run.successfulCandidates > 0 && utcMonth(run.completedAt) === month).length;
}

export function canSourceThisMonth(runs: SourcingRun[], now: Date) {
  return successfulRunsInMonth(runs, now) < MAX_SUCCESSFUL_RUNS_PER_MONTH;
}

export function selectEligibleSpecies(input: {
  species: SpeciesRecord[];
  productionSlugs: Set<string>;
  candidates: Candidate[];
  limit?: number;
}) {
  const limit = input.limit ?? MAX_BATCH_SIZE;
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_BATCH_SIZE) {
    throw new Error(`Batch limit must be between 1 and ${MAX_BATCH_SIZE}`);
  }
  const blocked = new Set(input.candidates.filter((item) => item.status !== "rejected" && item.status !== "published").map((item) => item.slug));
  return input.species
    .filter((item) => SLUG_PATTERN.test(item.slug) && !input.productionSlugs.has(item.slug) && !blocked.has(item.slug))
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .slice(0, limit);
}

export function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

export function writeJson(filePath: string, value: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function productionSlugs(speciesDirectory: string) {
  if (!fs.existsSync(speciesDirectory)) return new Set<string>();
  return new Set(fs.readdirSync(speciesDirectory)
    .filter((name) => name.endsWith(".webp") && name !== "placeholder.webp")
    .map((name) => name.slice(0, -5)));
}

export function hasCompleteRightsReview(candidate: Candidate) {
  return Boolean(
    candidate.source && candidate.sourceUrl && candidate.creator && candidate.license &&
    candidate.licenseUrl && candidate.attribution && candidate.commercialUseReviewed &&
    candidate.modificationsReviewed && candidate.rightsReviewer && candidate.rightsReviewedAt,
  );
}

export function hasCompleteProvenance(candidate: Candidate) {
  return Boolean(
    candidate.source && candidate.sourceUrl && candidate.creator && candidate.license &&
    candidate.licenseUrl && candidate.attribution,
  );
}

export function planBatchReview(input: {
  decision: BatchReviewDecision;
  run: SourcingRun;
  candidates: Candidate[];
}) : BatchReviewPlan {
  const { decision, run, candidates } = input;
  if (decision.schemaVersion !== 1) throw new Error("Unsupported batch review schema version.");
  if (decision.batchRunId !== run.id) throw new Error("Batch review does not match the sourcing run.");
  if (run.status !== "successful" || run.successfulCandidates < 1) throw new Error("Batch review must reference a successful sourcing run.");

  const approvedSlugs = decision.approved.map((slug) => slug.trim());
  const rejectedEntries = Object.entries(decision.rejected).map(([slug, reason]) => [slug.trim(), reason.trim()] as const);
  const replacementSlugs = decision.replacements.map((slug) => slug.trim());
  const ensureUnique = (values: string[], label: string) => {
    if (new Set(values).size !== values.length) throw new Error(`${label} contains duplicate species slugs.`);
  };
  ensureUnique(approvedSlugs, "Approved list");
  ensureUnique(rejectedEntries.map(([slug]) => slug), "Rejected list");
  ensureUnique(replacementSlugs, "Replacement list");

  const runSlugs = new Set(run.slugs);
  const approvedSet = new Set(approvedSlugs);
  const rejectedSet = new Set(rejectedEntries.map(([slug]) => slug));
  for (const slug of [...approvedSlugs, ...rejectedSet, ...replacementSlugs]) {
    if (!runSlugs.has(slug)) throw new Error(`Review decision contains species outside this batch: ${slug}`);
  }
  for (const slug of approvedSet) {
    if (rejectedSet.has(slug)) throw new Error(`Species cannot be both approved and rejected: ${slug}`);
  }
  for (const slug of replacementSlugs) {
    if (!approvedSet.has(slug)) throw new Error(`Replacement must also be approved: ${slug}`);
  }

  const decided = new Set([...approvedSet, ...rejectedSet]);
  const undecided = run.slugs.filter((slug) => !decided.has(slug));
  if (undecided.length) throw new Error(`Every candidate must be approved or rejected. Undecided: ${undecided.join(", ")}`);
  if (approvedSlugs.length && !decision.rightsConfirmed) {
    throw new Error("Approved candidates require explicit batch rights confirmation.");
  }
  for (const [slug, reason] of rejectedEntries) {
    if (!reason) throw new Error(`Rejected candidate requires a reason: ${slug}`);
  }

  const bySlug = new Map(candidates.map((candidate) => [candidate.slug, candidate]));
  const approved = approvedSlugs.map((slug) => {
    const candidate = bySlug.get(slug);
    if (!candidate) throw new Error(`Candidate manifest is missing batch species: ${slug}`);
    if (!["ready-for-review", "approved", "published"].includes(candidate.status)) {
      throw new Error(`Approved candidate is not ready for review: ${slug} (${candidate.status})`);
    }
    if (!candidate.preparedAssetPath) throw new Error(`Approved candidate has no prepared WebP: ${slug}`);
    if (!hasCompleteProvenance(candidate)) throw new Error(`Approved candidate has incomplete provenance or licensing metadata: ${slug}`);
    return candidate;
  });
  const rejected = rejectedEntries.map(([slug, reason]) => {
    const candidate = bySlug.get(slug);
    if (!candidate) throw new Error(`Candidate manifest is missing batch species: ${slug}`);
    if (candidate.status === "published") throw new Error(`Published candidate cannot be rejected: ${slug}`);
    return { candidate, reason };
  });
  return { approved, rejected, replacements: new Set(replacementSlugs) };
}

type RetryOptions = {
  baseDelayMs?: number;
  maxAttempts?: number;
  sleep?: (milliseconds: number) => Promise<void>;
};

export async function fetchWithRetry(
  input: string | URL,
  init?: RequestInit,
  options: RetryOptions = {},
) {
  const maxAttempts = options.maxAttempts ?? 4;
  const baseDelayMs = options.baseDelayMs ?? 1_000;
  const sleep = options.sleep ?? ((milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds)));
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(input, init);
      const retryable = response.status === 429 || response.status >= 500;
      if (!retryable || attempt === maxAttempts) return response;

      await response.body?.cancel();
      const retryAfterSeconds = Number(response.headers.get("retry-after"));
      const retryAfterMs = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
        ? retryAfterSeconds * 1_000
        : 0;
      const exponentialDelay = baseDelayMs * (2 ** (attempt - 1));
      await sleep(Math.min(Math.max(retryAfterMs, exponentialDelay), 10_000));
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts) throw error;
      await sleep(Math.min(baseDelayMs * (2 ** (attempt - 1)), 10_000));
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Request failed after retries.");
}

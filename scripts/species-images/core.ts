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

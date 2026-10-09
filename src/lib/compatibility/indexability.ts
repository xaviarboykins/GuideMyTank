import type { CompatibilityReport } from "./types";
import reviewedPairs from "../../../data/compatibility/known-regressions.json";
import speciesSources from "../../../data/import/species.sources.json";
import { getCompatibilityPairKey } from "./overrides";

export type CompatibilityIndexability = {
  indexable: boolean;
  tier: "reviewed" | "supported" | "provisional";
  reason:
    | "expert-reviewed"
    | "reviewed-regression"
    | "supported-computed-report"
    | "limited-data-confidence"
    | "incomplete-source-coverage";
};

type CompatibilityIndexabilityInput = Pick<
  CompatibilityReport["result"],
  "dataConfidence" | "expertValidated"
> & {
  sourcedSpeciesCount: number;
  reviewedResult: boolean;
};

/**
 * Compatibility pages remain available as tools even when they are not ready
 * to be search landing pages. Indexing is reserved for human-reviewed reports
 * or computed reports backed by references for both species and sufficient
 * structured-data confidence.
 */
export function getCompatibilityIndexability(
  input: CompatibilityIndexabilityInput,
): CompatibilityIndexability {
  if (input.expertValidated) {
    return { indexable: true, tier: "reviewed", reason: "expert-reviewed" };
  }

  if (input.reviewedResult) {
    return { indexable: true, tier: "reviewed", reason: "reviewed-regression" };
  }

  if (input.dataConfidence === "limited") {
    return {
      indexable: false,
      tier: "provisional",
      reason: "limited-data-confidence",
    };
  }

  if (input.sourcedSpeciesCount < 2) {
    return {
      indexable: false,
      tier: "provisional",
      reason: "incomplete-source-coverage",
    };
  }

  return {
    indexable: true,
    tier: "supported",
    reason: "supported-computed-report",
  };
}

export function getCompatibilityReportIndexability(
  report: CompatibilityReport,
) {
  const sourceSpeciesIds = new Set(
    report.sources.map((source) => source.speciesId),
  );
  const registryCoverage = [
    report.result.species_a.slug,
    report.result.species_b.slug,
  ].filter(hasSpeciesSourceCoverage).length;

  return getCompatibilityIndexability({
    dataConfidence: report.result.dataConfidence,
    expertValidated: report.result.expertValidated,
    reviewedResult: isReviewedCompatibilityResult(report),
    sourcedSpeciesCount: Math.max(sourceSpeciesIds.size, registryCoverage),
  });
}

const reviewedResults = new Map(
  reviewedPairs.pairs.map((pair) => [
    getCompatibilityPairKey(pair.species[0], pair.species[1]),
    new Set(pair.acceptable),
  ]),
);

const sourcedSpeciesSlugs = new Set(Object.keys(speciesSources.species));

export function hasSpeciesSourceCoverage(speciesSlug: string) {
  return sourcedSpeciesSlugs.has(speciesSlug);
}

export function isReviewedCompatibilityResult(report: CompatibilityReport) {
  const pairKey = getCompatibilityPairKey(
    report.result.species_a.slug,
    report.result.species_b.slug,
  );

  return reviewedResults.get(pairKey)?.has(report.result.compatibility ?? "") ?? false;
}

import {
  DEFAULT_RELATED_SPECIES_LIMIT,
  DEFAULT_RELATED_SPECIES_THRESHOLD,
  MAX_INTERNAL_LINK_LIMIT,
} from "./constants";
import {
  scoreCareRequirementSimilarity,
  scoreSpeciesSimilarity,
} from "./scoring";
import type {
  RelatedSpeciesCandidate,
  RelatedSpeciesGroups,
  RelatedSpeciesOptions,
  RelatedSpeciesRecommendation,
} from "./types";
import type { SpeciesRow } from "../../compatibility/types";

function getLimit(limit: number | undefined) {
  if (limit === undefined) {
    return DEFAULT_RELATED_SPECIES_LIMIT;
  }

  return Number.isFinite(limit) && limit > 0
    ? Math.min(Math.floor(limit), MAX_INTERNAL_LINK_LIMIT)
    : 0;
}

function getMinimumScore(minimumScore: number | undefined) {
  return minimumScore === undefined
    ? DEFAULT_RELATED_SPECIES_THRESHOLD
    : Math.max(0, Math.min(100, minimumScore));
}

function sortRecommendations(
  recommendations: RelatedSpeciesRecommendation[],
  limit: number,
) {
  return recommendations
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.species.common_name.localeCompare(b.species.common_name) ||
        a.species.slug.localeCompare(b.species.slug),
    )
    .slice(0, limit);
}

function compatibilityRecommendation(
  candidate: RelatedSpeciesCandidate,
): RelatedSpeciesRecommendation {
  return {
    species: candidate.species,
    score: candidate.compatibilityScore ?? 0,
    reasons: [
      candidate.compatibility === "compatible"
        ? "Explicitly classified as compatible."
        : "Explicitly classified as incompatible.",
    ],
  };
}

function addSimilarityRecommendation(
  target: RelatedSpeciesRecommendation[],
  species: SpeciesRow,
  score: number,
  reasons: string[],
  minimumScore: number,
) {
  if (score >= minimumScore) {
    target.push({ species, score, reasons });
  }
}

export function getRelatedSpecies(
  currentSpecies: SpeciesRow,
  candidates: RelatedSpeciesCandidate[],
  options: RelatedSpeciesOptions = {},
): RelatedSpeciesGroups {
  const limit = getLimit(options.limit);
  const minimumScore = getMinimumScore(options.minimumScore);
  const commonTankMates: RelatedSpeciesRecommendation[] = [];
  const similarSpecies: RelatedSpeciesRecommendation[] = [];
  const similarCareRequirements: RelatedSpeciesRecommendation[] = [];
  const speciesToAvoid: RelatedSpeciesRecommendation[] = [];
  const seenSpeciesIds = new Set<string>();

  if (limit === 0) {
    return {
      commonTankMates,
      similarSpecies,
      similarCareRequirements,
      speciesToAvoid,
    };
  }

  for (const candidate of candidates) {
    const { species } = candidate;

    if (
      candidate.availability === "draft" ||
      candidate.availability === "archived" ||
      species.id === currentSpecies.id ||
      species.slug === currentSpecies.slug ||
      seenSpeciesIds.has(species.id)
    ) {
      continue;
    }

    seenSpeciesIds.add(species.id);

    if (candidate.compatibility === "compatible") {
      commonTankMates.push(compatibilityRecommendation(candidate));
    }

    if (candidate.compatibility === "incompatible") {
      speciesToAvoid.push(compatibilityRecommendation(candidate));
      continue;
    }

    const similarity = scoreSpeciesSimilarity(currentSpecies, species);
    const careSimilarity = scoreCareRequirementSimilarity(
      currentSpecies,
      species,
    );

    if (similarity) {
      addSimilarityRecommendation(
        similarSpecies,
        species,
        similarity.score,
        similarity.reasons,
        minimumScore,
      );
    }

    if (careSimilarity) {
      addSimilarityRecommendation(
        similarCareRequirements,
        species,
        careSimilarity.score,
        careSimilarity.reasons,
        minimumScore,
      );
    }
  }

  return {
    commonTankMates: sortRecommendations(commonTankMates, limit),
    similarSpecies: sortRecommendations(similarSpecies, limit),
    similarCareRequirements: sortRecommendations(
      similarCareRequirements,
      limit,
    ),
    speciesToAvoid: sortRecommendations(speciesToAvoid, limit),
  };
}

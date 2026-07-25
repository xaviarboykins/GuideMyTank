import type { SpeciesRow } from "../../compatibility/types";
import {
  MIN_RELATED_SPECIES_COMPARABLE_WEIGHT,
  MIN_RELATED_SPECIES_SIGNALS,
} from "./constants";

type ScoreSignal = {
  points: number;
  weight: number;
  reason?: string;
};

export interface SpeciesSimilarityScore {
  score: number;
  comparableWeight: number;
  signalCount: number;
  reasons: string[];
}

type NumericRange = {
  minimum: number;
  maximum: number;
};

function getRange(
  minimum: number | null,
  maximum: number | null,
): NumericRange | null {
  return minimum != null && maximum != null && minimum <= maximum
    ? { minimum, maximum }
    : null;
}

function scoreExact(
  valueA: string | boolean | null,
  valueB: string | boolean | null,
  weight: number,
  reason: string,
): ScoreSignal | null {
  if (valueA == null || valueB == null) {
    return null;
  }

  return {
    points: valueA === valueB ? weight : 0,
    weight,
    ...(valueA === valueB ? { reason } : {}),
  };
}

function scoreNumericSimilarity(
  valueA: number | null,
  valueB: number | null,
  weight: number,
  reason: string,
): ScoreSignal | null {
  if (valueA == null || valueB == null) {
    return null;
  }

  const scale = Math.max(Math.abs(valueA), Math.abs(valueB), 1);
  const similarity = Math.max(0, 1 - Math.abs(valueA - valueB) / scale);
  const points = Math.round(weight * similarity);

  return {
    points,
    weight,
    ...(points >= weight * 0.6 ? { reason } : {}),
  };
}

function scoreRangeOverlap(
  rangeA: NumericRange | null,
  rangeB: NumericRange | null,
  weight: number,
  reason: string,
): ScoreSignal | null {
  if (!rangeA || !rangeB) {
    return null;
  }

  const overlap = Math.max(
    0,
    Math.min(rangeA.maximum, rangeB.maximum) -
      Math.max(rangeA.minimum, rangeB.minimum),
  );
  const narrowestWidth = Math.max(
    0.01,
    Math.min(
      rangeA.maximum - rangeA.minimum,
      rangeB.maximum - rangeB.minimum,
    ),
  );
  const points = Math.round(weight * Math.min(1, overlap / narrowestWidth));

  return {
    points,
    weight,
    ...(points >= weight * 0.6 ? { reason } : {}),
  };
}

function scoreTagOverlap(
  tagsA: string[],
  tagsB: string[],
  weight: number,
): ScoreSignal | null {
  if (tagsA.length === 0 || tagsB.length === 0) {
    return null;
  }

  const setA = new Set(tagsA);
  const setB = new Set(tagsB);
  const sharedTags = [...setA].filter((tag) => setB.has(tag));
  const unionSize = new Set([...setA, ...setB]).size;
  const points = Math.round(weight * (sharedTags.length / unionSize));

  return {
    points,
    weight,
    ...(sharedTags.length > 0
      ? { reason: `Shared profile: ${sharedTags.slice(0, 3).join(", ")}.` }
      : {}),
  };
}

function combineSignals(signals: Array<ScoreSignal | null>) {
  const availableSignals = signals.filter(
    (signal): signal is ScoreSignal => signal !== null,
  );
  const comparableWeight = availableSignals.reduce(
    (total, signal) => total + signal.weight,
    0,
  );

  if (
    availableSignals.length < MIN_RELATED_SPECIES_SIGNALS ||
    comparableWeight < MIN_RELATED_SPECIES_COMPARABLE_WEIGHT
  ) {
    return null;
  }

  return {
    score: availableSignals.reduce(
      (total, signal) => total + signal.points,
      0,
    ),
    comparableWeight,
    signalCount: availableSignals.length,
    reasons: availableSignals.flatMap((signal) =>
      signal.reason ? [signal.reason] : [],
    ),
  } satisfies SpeciesSimilarityScore;
}

function getTemperatureRange(species: SpeciesRow) {
  return getRange(
    species.recommended_min_temp_f ?? species.min_temp_f,
    species.recommended_max_temp_f ?? species.max_temp_f,
  );
}

export function scoreSpeciesSimilarity(
  current: SpeciesRow,
  candidate: SpeciesRow,
): SpeciesSimilarityScore | null {
  return combineSignals([
    scoreExact(
      current.temperament,
      candidate.temperament,
      15,
      "Similar temperament.",
    ),
    scoreNumericSimilarity(
      current.tank_size_gal,
      candidate.tank_size_gal,
      10,
      "Similar minimum tank size.",
    ),
    scoreRangeOverlap(
      getTemperatureRange(current),
      getTemperatureRange(candidate),
      8,
      "Temperature ranges overlap.",
    ),
    scoreRangeOverlap(
      getRange(current.min_ph, current.max_ph),
      getRange(candidate.min_ph, candidate.max_ph),
      7,
      "pH ranges overlap.",
    ),
    scoreRangeOverlap(
      getRange(current.min_gh_dgh, current.max_gh_dgh),
      getRange(candidate.min_gh_dgh, candidate.max_gh_dgh),
      5,
      "GH ranges overlap.",
    ),
    scoreNumericSimilarity(
      current.max_size_inches,
      candidate.max_size_inches,
      10,
      "Similar adult size.",
    ),
    scoreExact(
      current.care_level,
      candidate.care_level,
      10,
      "Same care level.",
    ),
    scoreTagOverlap(
      current.compatibility_tags,
      candidate.compatibility_tags,
      15,
    ),
    scoreExact(
      current.schooling,
      candidate.schooling,
      5,
      "Similar schooling behavior.",
    ),
    scoreExact(
      current.preferred_tank_style,
      candidate.preferred_tank_style,
      5,
      "Same preferred tank style.",
    ),
    scoreExact(
      current.activity_level,
      candidate.activity_level,
      5,
      "Similar activity level.",
    ),
    scoreExact(
      current.territory_zone,
      candidate.territory_zone,
      5,
      "Uses a similar aquarium zone.",
    ),
  ]);
}

export function scoreCareRequirementSimilarity(
  current: SpeciesRow,
  candidate: SpeciesRow,
): SpeciesSimilarityScore | null {
  return combineSignals([
    scoreNumericSimilarity(
      current.tank_size_gal,
      candidate.tank_size_gal,
      20,
      "Similar minimum tank size.",
    ),
    scoreRangeOverlap(
      getTemperatureRange(current),
      getTemperatureRange(candidate),
      12,
      "Temperature ranges overlap.",
    ),
    scoreRangeOverlap(
      getRange(current.min_ph, current.max_ph),
      getRange(candidate.min_ph, candidate.max_ph),
      10,
      "pH ranges overlap.",
    ),
    scoreRangeOverlap(
      getRange(current.min_gh_dgh, current.max_gh_dgh),
      getRange(candidate.min_gh_dgh, candidate.max_gh_dgh),
      8,
      "GH ranges overlap.",
    ),
    scoreNumericSimilarity(
      current.max_size_inches,
      candidate.max_size_inches,
      10,
      "Similar adult size.",
    ),
    scoreExact(
      current.care_level,
      candidate.care_level,
      15,
      "Same care level.",
    ),
    scoreExact(
      current.schooling,
      candidate.schooling,
      10,
      "Similar social requirements.",
    ),
    scoreExact(
      current.flow_preference,
      candidate.flow_preference,
      5,
      "Same flow preference.",
    ),
    scoreExact(
      current.hardness_preference,
      candidate.hardness_preference,
      5,
      "Same hardness preference.",
    ),
    scoreExact(
      current.preferred_tank_style,
      candidate.preferred_tank_style,
      5,
      "Same preferred tank style.",
    ),
  ]);
}

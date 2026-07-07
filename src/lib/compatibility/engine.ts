import type {
  CompatibilityResult,
  CompatibilitySpecies,
  CompatibilityStatus,
  EvaluationResult,
  SpeciesRow,
} from "@/lib/compatibility/types";

const invertebrateFamilies = new Set([
  "Atyidae",
  "Neritidae",
  "Ampullariidae",
  "Thiaridae",
]);

const COMPATIBILITY_WEIGHTS = {
  temperature: 20,
  ph: 15,
  aggression: 25,
  schooling: 10,
  predation: 20,
  tankSize: 10,
} as const;

function isInvertebrate(species: SpeciesRow) {
  return species.family ? invertebrateFamilies.has(species.family) : false;
}

function canEatTankmate(predator: SpeciesRow, tankmate: SpeciesRow) {
  if (!predator.max_size_inches || !tankmate.max_size_inches) {
    return false;
  }

  return (
    predator.max_size_inches >= tankmate.max_size_inches * 2.5 &&
    (predator.diet === "Carnivore" ||
      predator.temperament === "Aggressive" ||
      (predator.aggression_level ?? 0) >= 5)
  );
}

export function toCompatibilitySpecies(
  species: SpeciesRow,
): CompatibilitySpecies {
  return {
    slug: species.slug,
    common_name: species.common_name,
  };
}

export function determineStatus(score: number): CompatibilityStatus {
  if (score >= 96) return "Overwhelmingly Compatible";
  if (score >= 90) return "Very Compatible";
  if (score >= 70) return "Compatible";
  if (score >= 50) return "Caution";

  return "Incompatible";
}

export function legacyCompatibilityToScore(
  compatibility: CompatibilityResult["compatibility"],
) {
  if (compatibility === "compatible") return 100;
  if (compatibility === "caution") return 60;
  if (compatibility === "incompatible") return 25;

  return 0;
}

function createEvaluation(
  points: number,
  ...reasons: string[]
): EvaluationResult {
  return { points, reasons };
}

function getRangeOverlap(
  minA: number,
  maxA: number,
  minB: number,
  maxB: number,
) {
  return Math.min(maxA, maxB) - Math.max(minA, minB);
}

function evaluateTemperatureCompatibility(
  speciesA: SpeciesRow,
  speciesB: SpeciesRow,
): EvaluationResult {
  const { min_temp_f: minA, max_temp_f: maxA } = speciesA;
  const { min_temp_f: minB, max_temp_f: maxB } = speciesB;

  if (minA == null || maxA == null || minB == null || maxB == null) {
    return createEvaluation(15, "Temperature data is incomplete.");
  }

  const overlap = getRangeOverlap(minA, maxA, minB, maxB);

  if (overlap < 0)
    return createEvaluation(0, "Temperature requirements conflict.");
  if (overlap <= 2)
    return createEvaluation(10, "Temperature ranges have limited overlap.");

  return createEvaluation(
    COMPATIBILITY_WEIGHTS.temperature,
    "Temperature ranges overlap well.",
  );
}

function evaluatePhCompatibility(
  speciesA: SpeciesRow,
  speciesB: SpeciesRow,
): EvaluationResult {
  const { min_ph: minA, max_ph: maxA } = speciesA;
  const { min_ph: minB, max_ph: maxB } = speciesB;

  if (minA == null || maxA == null || minB == null || maxB == null) {
    return createEvaluation(12, "pH data is incomplete.");
  }

  const overlap = getRangeOverlap(minA, maxA, minB, maxB);

  if (overlap < 0) return createEvaluation(0, "pH requirements conflict.");
  if (overlap <= 0.3)
    return createEvaluation(8, "pH ranges have limited overlap.");

  return createEvaluation(
    COMPATIBILITY_WEIGHTS.ph,
    "pH requirements overlap well.",
  );
}

function getTemperamentScore(species: SpeciesRow) {
  if (species.temperament === "Aggressive") return 2;
  if (species.temperament === "Semi-Aggressive") return 1;

  return 0;
}

function evaluateAggressionCompatibility(
  speciesA: SpeciesRow,
  speciesB: SpeciesRow,
): EvaluationResult {
  const temperamentA = getTemperamentScore(speciesA);
  const temperamentB = getTemperamentScore(speciesB);
  const highestTemperament = Math.max(temperamentA, temperamentB);
  const lowestTemperament = Math.min(temperamentA, temperamentB);

  let points: number = COMPATIBILITY_WEIGHTS.aggression;
  let reason = "Species have similar temperament.";

  if (lowestTemperament === 0 && highestTemperament === 1) {
    points = 20;
    reason = "One species may be semi-aggressive and require planning.";
  }

  if (lowestTemperament === 1 && highestTemperament === 1) {
    points = 15;
    reason = "Both species may show territorial behavior.";
  }

  if (lowestTemperament === 1 && highestTemperament === 2) {
    points = 5;
    reason = "Aggression levels create a significant conflict.";
  }

  if (lowestTemperament === 0 && highestTemperament === 2) {
    points = 0;
    reason = "Aggressive temperament makes this pairing risky.";
  }

  if (lowestTemperament === 2 && highestTemperament === 2) {
    points = 0;
    reason = "Both species are aggressive and may not coexist safely.";
  }

  const aggressionA = speciesA.aggression_level ?? 0;
  const aggressionB = speciesB.aggression_level ?? 0;

  if (Math.abs(aggressionA - aggressionB) >= 3) {
    points = Math.max(0, points - 5);
  }

  return createEvaluation(points, reason);
}

function isSchoolingSpecies(species: SpeciesRow) {
  return species.compatibility_tags.some((tag) => {
    const normalizedTag = tag.toLowerCase();

    return (
      normalizedTag.includes("school") ||
      normalizedTag.includes("shoal") ||
      normalizedTag.includes("group")
    );
  });
}

function evaluateSchoolingCompatibility(
  speciesA: SpeciesRow,
  speciesB: SpeciesRow,
): EvaluationResult {
  if (
    !speciesA.compatibility_tags.length ||
    !speciesB.compatibility_tags.length
  ) {
    return createEvaluation(8, "Compatibility tag data is incomplete.");
  }

  const speciesASchools = isSchoolingSpecies(speciesA);
  const speciesBSchools = isSchoolingSpecies(speciesB);

  if (speciesASchools && speciesBSchools) {
    return createEvaluation(
      COMPATIBILITY_WEIGHTS.schooling,
      "Both species have compatible schooling or group behavior.",
    );
  }

  if (speciesASchools || speciesBSchools) {
    return createEvaluation(
      8,
      "One species should be maintained in a proper school or group.",
    );
  }

  return createEvaluation(
    COMPATIBILITY_WEIGHTS.schooling,
    "Social requirements align.",
  );
}

function evaluatePredationRisk(
  speciesA: SpeciesRow,
  speciesB: SpeciesRow,
): EvaluationResult {
  if (
    (isInvertebrate(speciesA) && speciesB.invert_safe === false) ||
    (isInvertebrate(speciesB) && speciesA.invert_safe === false)
  ) {
    return createEvaluation(0, "One species is not safe with invertebrates.");
  }

  if (
    canEatTankmate(speciesA, speciesB) ||
    canEatTankmate(speciesB, speciesA)
  ) {
    return createEvaluation(0, "Size and diet create a predation risk.");
  }

  return createEvaluation(
    COMPATIBILITY_WEIGHTS.predation,
    "No predation risk detected.",
  );
}

function evaluateTankSizeCompatibility(
  speciesA: SpeciesRow,
  speciesB: SpeciesRow,
): EvaluationResult {
  const tankSizeA = speciesA.tank_size_gal;
  const tankSizeB = speciesB.tank_size_gal;

  if (tankSizeA == null || tankSizeB == null) {
    return createEvaluation(8, "Tank size data is incomplete.");
  }

  const tankSizeGap = Math.abs(tankSizeA - tankSizeB);

  if (tankSizeGap < 10) {
    return createEvaluation(
      COMPATIBILITY_WEIGHTS.tankSize,
      "Tank size requirements align.",
    );
  }

  if (tankSizeGap < 20)
    return createEvaluation(8, "Tank size requirements differ slightly.");
  if (tankSizeGap < 40)
    return createEvaluation(5, "Tank size requirements differ moderately.");

  return createEvaluation(
    0,
    "One species requires a significantly larger aquarium.",
  );
}

export function calculateCompatibility(
  speciesA: SpeciesRow,
  speciesB: SpeciesRow,
): CompatibilityResult {
  const evaluations = [
    evaluateTemperatureCompatibility(speciesA, speciesB),
    evaluatePhCompatibility(speciesA, speciesB),
    evaluateAggressionCompatibility(speciesA, speciesB),
    evaluateSchoolingCompatibility(speciesA, speciesB),
    evaluatePredationRisk(speciesA, speciesB),
    evaluateTankSizeCompatibility(speciesA, speciesB),
  ];

  const score = evaluations.reduce(
    (total, evaluation) => total + evaluation.points,
    0,
  );

  const reasons = evaluations.flatMap((evaluation) => evaluation.reasons);
  const status = determineStatus(score);

  const compatibility =
    score >= 70 ? "compatible" : score >= 50 ? "caution" : "incompatible";

  const notes =
    reasons.length > 0
      ? `Computed from species profile data: ${reasons.join(" ")}`
      : null;

  return {
    score,
    status,
    reasons,
    compatibility,
    confidence: score / 100,
    notes,
    species_a: toCompatibilitySpecies(speciesA),
    species_b: toCompatibilitySpecies(speciesB),
  };
}

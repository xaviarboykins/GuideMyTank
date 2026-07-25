import type {
  CompatibilityResult,
  CompatibilityDiagnostics,
  CompatibilityEvaluationDiagnostic,
  CompatibilityFinding,
  CompatibilityFindingCategory,
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

const evaluationFindingMetadata: Record<
  string,
  {
    category: CompatibilityFindingCategory;
    maximumPoints: number;
  }
> = {
  temperature: {
    category: "water-parameters",
    maximumPoints: COMPATIBILITY_WEIGHTS.temperature,
  },
  ph: {
    category: "water-parameters",
    maximumPoints: COMPATIBILITY_WEIGHTS.ph,
  },
  aggression: {
    category: "temperament",
    maximumPoints: COMPATIBILITY_WEIGHTS.aggression,
  },
  schooling: {
    category: "grouping",
    maximumPoints: COMPATIBILITY_WEIGHTS.schooling,
  },
  predation: {
    category: "predation",
    maximumPoints: COMPATIBILITY_WEIGHTS.predation,
  },
  tank_size: {
    category: "space",
    maximumPoints: COMPATIBILITY_WEIGHTS.tankSize,
  },
  trait_risk_caps: {
    category: "configuration",
    maximumPoints: 0,
  },
  behavior_risk_caps: {
    category: "temperament",
    maximumPoints: 0,
  },
};

const requiredPairFields = [
  "max_size_inches",
  "tank_size_gal",
  "min_temp_f",
  "max_temp_f",
  "min_ph",
  "max_ph",
  "temperament",
  "aggression_level",
] as const;

const SEVERE_AGGRESSION_LEVEL = 7;
const INCOMPATIBLE_SCORE_CEILING = 49;
const CAUTION_SCORE = 60;
const CORE_CONFIDENCE_WEIGHT = 0.75;

const confidenceCoreFields = [
  "max_size_inches",
  "tank_size_gal",
  "min_temp_f",
  "max_temp_f",
  "min_ph",
  "max_ph",
  "temperament",
  "aggression_level",
] as const;

const confidenceContextFields = [
  "recommended_min_temp_f",
  "recommended_max_temp_f",
  "min_gh_dgh",
  "max_gh_dgh",
  "min_kh_dkh",
  "max_kh_dkh",
  "territory_zone",
  "territory_footprint",
  "activity_level",
  "flow_preference",
  "preferred_tank_style",
  "temperature_category",
] as const;

function hasConfidenceValue(value: unknown) {
  return value !== null && value !== undefined && value !== "";
}

function getFieldCompleteness(
  species: SpeciesRow,
  fields: readonly (keyof SpeciesRow)[],
) {
  const populated = fields.filter((field) =>
    hasConfidenceValue(species[field]),
  ).length;

  return populated / fields.length;
}

export function calculateCompatibilityConfidence(
  speciesA: SpeciesRow,
  speciesB: SpeciesRow,
) {
  const speciesConfidence = [speciesA, speciesB].map((species) => {
    const coreCompleteness =
      (getFieldCompleteness(species, confidenceCoreFields) * 8 +
        (species.compatibility_tags.length > 0 ? 1 : 0)) /
      9;
    const contextCompleteness = getFieldCompleteness(
      species,
      confidenceContextFields,
    );

    return (
      coreCompleteness * CORE_CONFIDENCE_WEIGHT +
      contextCompleteness * (1 - CORE_CONFIDENCE_WEIGHT)
    );
  });

  return (
    Math.round(
      ((speciesConfidence[0] + speciesConfidence[1]) / 2) * 100,
    ) / 100
  );
}

function buildCompatibilitySummary(
  compatibility: CompatibilityResult["compatibility"],
) {
  if (compatibility === "incompatible") {
    return "Structured species data identifies a serious conflict for this pairing.";
  }
  if (compatibility === "caution") {
    return "Structured species data identifies risks that require careful aquarium planning.";
  }

  return "Structured species data supports this pairing when normal tank size, group size, and husbandry requirements are met.";
}

function getFindingState(
  evaluation: CompatibilityEvaluationDiagnostic,
  maximumPoints: number,
) {
  if (evaluation.reasons.some((reason) => reason.includes("incomplete"))) {
    return "data_incomplete";
  }
  if (evaluation.scoreCap != null) return "constraint";
  if (evaluation.points < maximumPoints) return "risk";
  return "aligned";
}

function getFindingSeverity(
  evaluation: CompatibilityEvaluationDiagnostic,
  state: string,
): CompatibilityFinding["severity"] {
  if (state === "data_incomplete") return "warning";
  if (evaluation.scoreCap != null) {
    return evaluation.scoreCap < 50 ? "error" : "warning";
  }
  return state === "risk" ? "warning" : "info";
}

export function buildCompatibilityFindings(
  speciesA: SpeciesRow,
  speciesB: SpeciesRow,
  evaluations: CompatibilityEvaluationDiagnostic[],
): CompatibilityFinding[] {
  const findings: CompatibilityFinding[] = evaluations.flatMap((evaluation) => {
    const metadata = evaluationFindingMetadata[evaluation.code] ?? {
      category: "configuration" as const,
      maximumPoints: 0,
    };
    const state = getFindingState(evaluation, metadata.maximumPoints);

    return evaluation.reasons.map((message, index) => ({
      code: `${evaluation.code}.${state}.${index + 1}`,
      category:
        state === "data_incomplete"
          ? ("data-quality" as const)
          : metadata.category,
      severity: getFindingSeverity(evaluation, state),
      message,
      evidence: {
        evaluator: evaluation.code,
        points: evaluation.points,
        maximumPoints: metadata.maximumPoints,
        scoreCap: evaluation.scoreCap ?? null,
      },
    }));
  });

  for (const species of [speciesA, speciesB]) {
    for (const field of requiredPairFields) {
      if (species[field] == null) {
        findings.push({
          code: `data-quality.missing.${field}.${species.slug}`,
          category: "data-quality",
          severity: "warning",
          message: `${species.common_name} is missing ${field.replaceAll("_", " ")} data.`,
          evidence: {
            speciesId: species.id,
            speciesSlug: species.slug,
            field,
          },
        });
      }
    }
    if (species.compatibility_tags.length === 0) {
      findings.push({
        code: `data-quality.missing.compatibility_tags.${species.slug}`,
        category: "data-quality",
        severity: "warning",
        message: `${species.common_name} has no structured compatibility tags.`,
        evidence: {
          speciesId: species.id,
          speciesSlug: species.slug,
          field: "compatibility_tags",
        },
      });
    }
  }

  const bothExplicitlyAggressive =
    speciesA.temperament === "Aggressive" &&
    speciesB.temperament === "Aggressive";
  const bothSeverelyAggressive =
    (speciesA.aggression_level ?? 0) >= SEVERE_AGGRESSION_LEVEL &&
    (speciesB.aggression_level ?? 0) >= SEVERE_AGGRESSION_LEVEL;

  if (bothExplicitlyAggressive || bothSeverelyAggressive) {
    findings.push({
      code: "temperament.severe_mutual_aggression",
      category: "temperament",
      severity: "error",
      message:
        "Both species have severe structured aggression and should not be presented as generally compatible.",
      evidence: {
        speciesA: {
          slug: speciesA.slug,
          temperament: speciesA.temperament,
          aggressionLevel: speciesA.aggression_level,
        },
        speciesB: {
          slug: speciesB.slug,
          temperament: speciesB.temperament,
          aggressionLevel: speciesB.aggression_level,
        },
        severeAggressionLevel: SEVERE_AGGRESSION_LEVEL,
      },
    });
  }

  return findings;
}

export function resolveCompatibilityFromFindings(
  legacyResult: CompatibilityResult,
  findings: CompatibilityFinding[],
): CompatibilityResult {
  const hardBlockers = findings.filter(
    (finding) => finding.severity === "error",
  );
  const missingEssentialData = findings.some((finding) =>
    finding.code.startsWith("data-quality.missing."),
  );

  let score = legacyResult.score;
  let compatibility = legacyResult.compatibility;

  if (hardBlockers.length > 0) {
    score = Math.min(score, INCOMPATIBLE_SCORE_CEILING);
    compatibility = "incompatible";
  } else if (missingEssentialData && compatibility === "compatible") {
    score = Math.min(score, CAUTION_SCORE);
    compatibility = "caution";
  }

  if (
    score === legacyResult.score &&
    compatibility === legacyResult.compatibility
  ) {
    return legacyResult;
  }

  const additionalReasons = hardBlockers
    .map((finding) => finding.message)
    .filter((message) => !legacyResult.reasons.includes(message));
  if (missingEssentialData && compatibility === "caution") {
    additionalReasons.push(
      "Essential compatibility data is incomplete, so this pair cannot be presented as unconditionally compatible.",
    );
  }
  const reasons = [...legacyResult.reasons, ...new Set(additionalReasons)];

  return {
    ...legacyResult,
    score,
    status: determineStatus(score),
    compatibility,
    reasons,
    notes: buildCompatibilitySummary(compatibility),
  };
}

function isInvertebrate(species: SpeciesRow) {
  return species.family ? invertebrateFamilies.has(species.family) : false;
}

function hasTag(species: SpeciesRow, tag: string) {
  return species.compatibility_tags.some(
    (compatibilityTag) => compatibilityTag.toLowerCase() === tag,
  );
}

function hasSummaryPattern(species: SpeciesRow, pattern: RegExp) {
  return species.summary ? pattern.test(species.summary.toLowerCase()) : false;
}

function isTerritorialSpecies(species: SpeciesRow) {
  return hasTag(species, "territorial");
}

function isSolitarySpecies(species: SpeciesRow) {
  return hasTag(species, "solitary");
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

function requiresGroup(species: SpeciesRow) {
  return (
    species.schooling === true ||
    (species.min_group_size ?? 1) > 1 ||
    isSchoolingSpecies(species)
  );
}

function isPuffer(species: SpeciesRow) {
  return species.family === "Tetraodontidae";
}

function isLikelyFinNipper(species: SpeciesRow) {
  return (
    species.fin_nipping_risk === true ||
    isPuffer(species) ||
    hasSummaryPattern(species, /fin[- ]?nipp|nipp.*fin|nip.*fin/)
  );
}

function isLongFinnedOrSlow(species: SpeciesRow) {
  return (
    species.long_fin_vulnerable === true ||
    species.slow_moving === true ||
    hasSummaryPattern(species, /long .*fin|flowing fin|impressive dorsal fin/)
  );
}

function canEatTankmate(predator: SpeciesRow, tankmate: SpeciesRow) {
  if (!predator.max_size_inches || !tankmate.max_size_inches) {
    return false;
  }

  const sizeRatio = predator.max_size_inches / tankmate.max_size_inches;
  const mouthGapeThreshold =
    (tankmate.armored_body ? 4 : 0) ||
    (tankmate.deep_bodied ? 3.5 : 0) ||
    (tankmate.slender_prey_body ? 1.8 : 3.5);
  const aggressivePredatorThreshold =
    (tankmate.armored_body ? 4 : 0) ||
    (tankmate.deep_bodied ? 3.5 : 0) ||
    (tankmate.slender_prey_body ? 2.5 : 3);

  if (
    (predator.mouth_gape_risk === true ||
      predator.surface_predator === true) &&
    sizeRatio >= mouthGapeThreshold
  ) {
    return true;
  }

  return (
    predator.temperament === "Aggressive" &&
    predator.max_size_inches >= 6 &&
    sizeRatio >= aggressivePredatorThreshold
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
  if (score >= 90) return "High Compatibility";
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

function createScoreCap(scoreCap: number, ...reasons: string[]) {
  return { points: 0, reasons, scoreCap };
}

function getRangeOverlap(
  minA: number,
  maxA: number,
  minB: number,
  maxB: number,
) {
  return Math.min(maxA, maxB) - Math.max(minA, minB);
}

function getRecommendedTempRange(species: SpeciesRow) {
  return {
    min: species.recommended_min_temp_f ?? species.min_temp_f,
    max: species.recommended_max_temp_f ?? species.max_temp_f,
  };
}

function evaluateTemperatureCompatibility(
  speciesA: SpeciesRow,
  speciesB: SpeciesRow,
): EvaluationResult {
  const { min: minA, max: maxA } = getRecommendedTempRange(speciesA);
  const { min: minB, max: maxB } = getRecommendedTempRange(speciesB);

  if (minA == null || maxA == null || minB == null || maxB == null) {
    return createEvaluation(15, "Temperature data is incomplete.");
  }

  const overlap = getRangeOverlap(minA, maxA, minB, maxB);

  if (overlap < 0)
    return createScoreCap(45, "Temperature requirements conflict.");
  if (overlap <= 2)
    return createScoreCap(60, "Temperature ranges have limited overlap.");

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

  if (overlap < 0) return createScoreCap(45, "pH requirements conflict.");
  if (overlap <= 0.3)
    return createScoreCap(60, "pH ranges have limited overlap.");

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

  if (
    isTerritorialSpecies(speciesA) &&
    isTerritorialSpecies(speciesB) &&
    aggressionA + aggressionB >= 10
  ) {
    points = Math.min(points, 5);
    reason =
      "Both species are territorial with high aggression, creating a serious space conflict.";
  }

  return createEvaluation(points, reason);
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

  const speciesASchools = requiresGroup(speciesA);
  const speciesBSchools = requiresGroup(speciesB);

  if (speciesASchools && speciesBSchools) {
    return createEvaluation(
      COMPATIBILITY_WEIGHTS.schooling,
      "Both species have compatible schooling or group behavior.",
    );
  }

  if (speciesASchools || speciesBSchools) {
    const groupSpecies = speciesASchools ? speciesA : speciesB;
    const otherSpecies = speciesASchools ? speciesB : speciesA;

    if (
      isSolitarySpecies(otherSpecies) &&
      (isTerritorialSpecies(otherSpecies) ||
        (otherSpecies.aggression_level ?? 0) >= 5 ||
        (groupSpecies.aggression_level ?? 0) >= 5)
    ) {
      return createEvaluation(
        2,
        "One species needs a group while the other is solitary or territorial.",
      );
    }

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
    return createScoreCap(
      40,
      "One species is not safe with invertebrates.",
    );
  }

  if (
    canEatTankmate(speciesA, speciesB) ||
    canEatTankmate(speciesB, speciesA)
  ) {
    return createScoreCap(40, "Size and diet create a predation risk.");
  }

  return createEvaluation(
    COMPATIBILITY_WEIGHTS.predation,
    "No predation risk detected.",
  );
}

function hasHardnessConflict(speciesA: SpeciesRow, speciesB: SpeciesRow) {
  return (
    (speciesA.hardness_preference === "soft" &&
      speciesB.hardness_preference === "hard") ||
    (speciesA.hardness_preference === "hard" &&
      speciesB.hardness_preference === "soft")
  );
}

function hasFlowConflict(speciesA: SpeciesRow, speciesB: SpeciesRow) {
  return (
    (speciesA.flow_preference === "low" &&
      speciesB.flow_preference === "high") ||
    (speciesA.flow_preference === "high" &&
      speciesB.flow_preference === "low")
  );
}

function isHighActivity(species: SpeciesRow) {
  return (
    species.activity_level === "active" ||
    species.activity_level === "boisterous" ||
    species.competitive_feeder === true
  );
}

function isVulnerableToActivity(species: SpeciesRow) {
  return (
    species.slow_moving === true ||
    species.delicate_species === true ||
    species.long_fin_vulnerable === true
  );
}

function hasActivityConflict(speciesA: SpeciesRow, speciesB: SpeciesRow) {
  return (
    (isHighActivity(speciesA) && isVulnerableToActivity(speciesB)) ||
    (isHighActivity(speciesB) && isVulnerableToActivity(speciesA))
  );
}

function getOverlapFromNullableRange(
  minA: number | null,
  maxA: number | null,
  minB: number | null,
  maxB: number | null,
) {
  if (minA == null || maxA == null || minB == null || maxB == null) {
    return null;
  }

  return getRangeOverlap(minA, maxA, minB, maxB);
}

function hasGhKhConflict(speciesA: SpeciesRow, speciesB: SpeciesRow) {
  const ghOverlap = getOverlapFromNullableRange(
    speciesA.min_gh_dgh,
    speciesA.max_gh_dgh,
    speciesB.min_gh_dgh,
    speciesB.max_gh_dgh,
  );
  const khOverlap = getOverlapFromNullableRange(
    speciesA.min_kh_dkh,
    speciesA.max_kh_dkh,
    speciesB.min_kh_dkh,
    speciesB.max_kh_dkh,
  );

  return (
    (ghOverlap != null && ghOverlap < 0) ||
    (khOverlap != null && khOverlap < 0)
  );
}

function hasLimitedWaterStabilityOverlap(
  speciesA: SpeciesRow,
  speciesB: SpeciesRow,
) {
  if (!speciesA.ph_stability_required && !speciesB.ph_stability_required) {
    return false;
  }

  const phOverlap = getOverlapFromNullableRange(
    speciesA.min_ph,
    speciesA.max_ph,
    speciesB.min_ph,
    speciesB.max_ph,
  );
  const ghOverlap = getOverlapFromNullableRange(
    speciesA.min_gh_dgh,
    speciesA.max_gh_dgh,
    speciesB.min_gh_dgh,
    speciesB.max_gh_dgh,
  );
  const khOverlap = getOverlapFromNullableRange(
    speciesA.min_kh_dkh,
    speciesA.max_kh_dkh,
    speciesB.min_kh_dkh,
    speciesB.max_kh_dkh,
  );

  return (
    (phOverlap != null && phOverlap <= 0.3) ||
    (ghOverlap != null && ghOverlap <= 2) ||
    (khOverlap != null && khOverlap <= 1)
  );
}

function hasTemperatureCategoryConflict(
  speciesA: SpeciesRow,
  speciesB: SpeciesRow,
) {
  return (
    (speciesA.temperature_category === "cool" &&
      speciesB.temperature_category === "warm") ||
    (speciesA.temperature_category === "warm" &&
      speciesB.temperature_category === "cool")
  );
}

function hasSpecialistStyleConflict(
  specialist: SpeciesRow,
  tankmate: SpeciesRow,
) {
  if (
    !specialist.specialist_setup ||
    !specialist.preferred_tank_style ||
    !tankmate.preferred_tank_style
  ) {
    return false;
  }

  if (specialist.preferred_tank_style === tankmate.preferred_tank_style) {
    return false;
  }

  if (
    specialist.preferred_tank_style === "planted" &&
    tankmate.preferred_tank_style === "community"
  ) {
    return false;
  }

  if (
    specialist.preferred_tank_style === "community" &&
    tankmate.preferred_tank_style === "planted"
  ) {
    return false;
  }

  return true;
}

function evaluateTraitRiskCaps(
  speciesA: SpeciesRow,
  speciesB: SpeciesRow,
): EvaluationResult {
  const caps: number[] = [];
  const reasons: string[] = [];

  if (
    speciesA.species_only_preferred ||
    speciesB.species_only_preferred
  ) {
    caps.push(45);
    reasons.push("One species is best planned as a species-only setup.");
  }

  if (hasHardnessConflict(speciesA, speciesB)) {
    caps.push(60);
    reasons.push("Water hardness preferences conflict.");
  }

  if (hasGhKhConflict(speciesA, speciesB)) {
    caps.push(60);
    reasons.push("GH or KH ranges do not overlap well.");
  }

  if (hasLimitedWaterStabilityOverlap(speciesA, speciesB)) {
    caps.push(60);
    reasons.push(
      "A species needing stable water has only a narrow pH, GH, or KH overlap.",
    );
  }

  if (hasTemperatureCategoryConflict(speciesA, speciesB)) {
    caps.push(60);
    reasons.push("Cool-water and warm-water preferences conflict.");
  }

  if (hasFlowConflict(speciesA, speciesB)) {
    caps.push(60);
    reasons.push("Water flow preferences conflict.");
  }

  if (hasActivityConflict(speciesA, speciesB)) {
    caps.push(60);
    reasons.push(
      "Activity level or feeding speed may stress a slow, delicate, or long-finned species.",
    );
  }

  if (
    hasSpecialistStyleConflict(speciesA, speciesB) ||
    hasSpecialistStyleConflict(speciesB, speciesA)
  ) {
    caps.push(60);
    reasons.push("Specialist tank style requirements need careful matching.");
  }

  if (caps.length > 0) {
    return createScoreCap(Math.min(...caps), ...reasons);
  }

  return createEvaluation(0, "No structured trait override detected.");
}

function getSpeciesZones(species: SpeciesRow) {
  const zones = new Set<string>();

  if (species.territory_zone && species.territory_zone !== "none") {
    zones.add(species.territory_zone);
  }
  if (hasTag(species, "top_water")) zones.add("top");
  if (hasTag(species, "mid_water")) zones.add("mid");
  if (hasTag(species, "bottom_dweller")) zones.add("bottom");

  if (zones.size === 0 || zones.has("all") || zones.has("open")) {
    return new Set(["top", "mid", "bottom", "cave", "open"]);
  }

  if (zones.has("cave")) {
    zones.add("bottom");
  }

  return zones;
}

function zonesOverlap(speciesA: SpeciesRow, speciesB: SpeciesRow) {
  const zonesA = getSpeciesZones(speciesA);
  const zonesB = getSpeciesZones(speciesB);

  for (const zone of zonesA) {
    if (zonesB.has(zone)) {
      return true;
    }
  }

  return false;
}

function getTerritoryFootprintScore(species: SpeciesRow) {
  if (species.territory_footprint === "large") return 3;
  if (species.territory_footprint === "medium") return 2;
  if (species.territory_footprint === "small") return 1;

  return 0;
}

function hasTerritoryFootprintConflict(
  speciesA: SpeciesRow,
  speciesB: SpeciesRow,
) {
  if (!zonesOverlap(speciesA, speciesB)) {
    return false;
  }

  const footprintTotal =
    getTerritoryFootprintScore(speciesA) +
    getTerritoryFootprintScore(speciesB);

  return (
    footprintTotal >= 3 &&
    (isTerritorialSpecies(speciesA) || isTerritorialSpecies(speciesB))
  );
}

function hasBreedingAggressionConflict(
  speciesA: SpeciesRow,
  speciesB: SpeciesRow,
) {
  const footprintTotal =
    getTerritoryFootprintScore(speciesA) +
    getTerritoryFootprintScore(speciesB);

  return (
    (speciesA.breeding_aggression || speciesB.breeding_aggression) &&
    zonesOverlap(speciesA, speciesB) &&
    footprintTotal >= 2 &&
    ((speciesA.aggression_level ?? 0) >= 5 ||
      (speciesB.aggression_level ?? 0) >= 5 ||
      speciesA.temperament === "Semi-Aggressive" ||
      speciesB.temperament === "Semi-Aggressive")
  );
}

function hasRelatedTerritorialConflict(
  speciesA: SpeciesRow,
  speciesB: SpeciesRow,
) {
  if (!speciesA.family || speciesA.family !== speciesB.family) {
    return false;
  }

  const hasTerritorialSolitarySpecies =
    (isTerritorialSpecies(speciesA) && isSolitarySpecies(speciesA)) ||
    (isTerritorialSpecies(speciesB) && isSolitarySpecies(speciesB));
  const combinedAggression =
    (speciesA.aggression_level ?? 0) + (speciesB.aggression_level ?? 0);

  return (
    hasTerritorialSolitarySpecies &&
    combinedAggression >= 7 &&
    zonesOverlap(speciesA, speciesB)
  );
}

function evaluateBehaviorRiskCaps(
  speciesA: SpeciesRow,
  speciesB: SpeciesRow,
): EvaluationResult {
  const caps: number[] = [];
  const reasons: string[] = [];

  if (
    getTemperamentScore(speciesA) > 0 &&
    getTemperamentScore(speciesB) > 0
  ) {
    caps.push(60);
    reasons.push(
      "Two non-peaceful species require cautious stocking, sufficient space, and close behavior monitoring.",
    );
  }

  if (isPuffer(speciesA) !== isPuffer(speciesB)) {
    caps.push(60);
    reasons.push(
      "Freshwater puffers are specialist fin-nipping hunters and are poor community tankmates.",
    );
  }

  if (
    (isLikelyFinNipper(speciesA) && isLongFinnedOrSlow(speciesB)) ||
    (isLikelyFinNipper(speciesB) && isLongFinnedOrSlow(speciesA))
  ) {
    caps.push(60);
    reasons.push(
      "Fin-nipping risk is high with long-finned or slow-moving tankmates.",
    );
  }

  if (
    isTerritorialSpecies(speciesA) &&
    isTerritorialSpecies(speciesB) &&
    (speciesA.aggression_level ?? 0) + (speciesB.aggression_level ?? 0) >= 10
  ) {
    caps.push(60);
    reasons.push(
      "Both species defend territory aggressively and are likely to stress or injure each other.",
    );
  }

  if (hasTerritoryFootprintConflict(speciesA, speciesB)) {
    caps.push(60);
    reasons.push(
      "Territorial footprint and swimming zone overlap require extra space and cover.",
    );
  }

  if (hasBreedingAggressionConflict(speciesA, speciesB)) {
    caps.push(60);
    reasons.push(
      "Breeding aggression can turn an otherwise workable pairing into a caution setup.",
    );
  }

  if (hasRelatedTerritorialConflict(speciesA, speciesB)) {
    caps.push(60);
    reasons.push(
      "Closely related fish sharing a swimming zone may recognize each other as territorial rivals.",
    );
  }

  if (
    isSolitarySpecies(speciesA) &&
    isSolitarySpecies(speciesB) &&
    ((speciesA.aggression_level ?? 0) >= 5 ||
      (speciesB.aggression_level ?? 0) >= 5)
  ) {
    caps.push(60);
    reasons.push(
      "Solitary aggressive species usually need carefully planned tankmates, if any.",
    );
  }

  if (
    (requiresGroup(speciesA) &&
      isSolitarySpecies(speciesB) &&
      (isTerritorialSpecies(speciesB) ||
        (speciesB.aggression_level ?? 0) >= 5) &&
      ((speciesB.aggression_level ?? 0) >= 5 ||
        (speciesA.aggression_level ?? 0) >= 5 ||
        isLikelyFinNipper(speciesB))) ||
    (requiresGroup(speciesB) &&
      isSolitarySpecies(speciesA) &&
      (isTerritorialSpecies(speciesA) ||
        (speciesA.aggression_level ?? 0) >= 5) &&
      ((speciesA.aggression_level ?? 0) >= 5 ||
        (speciesB.aggression_level ?? 0) >= 5 ||
        isLikelyFinNipper(speciesA)))
  ) {
    caps.push(60);
    reasons.push(
      "A schooling or shoaling species conflicts with a solitary territorial tankmate.",
    );
  }

  if (caps.length > 0) {
    return createScoreCap(Math.min(...caps), ...reasons);
  }

  return createEvaluation(0, "No severe behavior override detected.");
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
  return calculateCompatibilityDiagnostics(speciesA, speciesB).result;
}

export function calculateCompatibilityDiagnostics(
  speciesA: SpeciesRow,
  speciesB: SpeciesRow,
): CompatibilityDiagnostics {
  const evaluations = [
    {
      code: "temperature",
      ...evaluateTemperatureCompatibility(speciesA, speciesB),
    },
    { code: "ph", ...evaluatePhCompatibility(speciesA, speciesB) },
    {
      code: "aggression",
      ...evaluateAggressionCompatibility(speciesA, speciesB),
    },
    {
      code: "schooling",
      ...evaluateSchoolingCompatibility(speciesA, speciesB),
    },
    {
      code: "predation",
      ...evaluatePredationRisk(speciesA, speciesB),
    },
    {
      code: "tank_size",
      ...evaluateTankSizeCompatibility(speciesA, speciesB),
    },
    {
      code: "trait_risk_caps",
      ...evaluateTraitRiskCaps(speciesA, speciesB),
    },
    {
      code: "behavior_risk_caps",
      ...evaluateBehaviorRiskCaps(speciesA, speciesB),
    },
  ];

  const rawScore = evaluations.reduce(
    (total, evaluation) => total + evaluation.points,
    0,
  );
  const scoreCap = evaluations.reduce<number | null>((currentCap, evaluation) => {
    if (evaluation.scoreCap == null) {
      return currentCap;
    }

    return currentCap == null
      ? evaluation.scoreCap
      : Math.min(currentCap, evaluation.scoreCap);
  }, null);
  const score = scoreCap == null ? rawScore : Math.min(rawScore, scoreCap);

  const reasons = evaluations
    .flatMap((evaluation) => evaluation.reasons)
    .filter(
      (reason) =>
        reason !== "No structured trait override detected." &&
        reason !== "No severe behavior override detected.",
    );
  const status = determineStatus(score);

  const compatibility =
    score >= 70 ? "compatible" : score >= 50 ? "caution" : "incompatible";

  const notes = buildCompatibilitySummary(compatibility);

  const legacyResult: CompatibilityResult = {
    score,
    status,
    reasons,
    compatibility,
    confidence: calculateCompatibilityConfidence(speciesA, speciesB),
    notes,
    expertValidated: false,
    species_a: toCompatibilitySpecies(speciesA),
    species_b: toCompatibilitySpecies(speciesB),
  };
  const findings = buildCompatibilityFindings(
    speciesA,
    speciesB,
    evaluations,
  );
  const result = resolveCompatibilityFromFindings(
    legacyResult,
    findings,
  );

  return {
    result,
    legacyResult,
    rawScore,
    scoreCap,
    evaluations,
    findings,
  };
}

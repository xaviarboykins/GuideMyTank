import type {
  CompatibilityResult,
  CompatibilitySpecies,
  CompatibilityStatus,
  EvaluationResult,
  SpeciesRow,
} from "@/lib/compatibility/types";
import {
  evaluateSpeciesSpecialRules,
  hasSpeciesSpecialRule,
} from "@/lib/compatibility/special-rules";

const invertebrateFamilies = new Set([
  "Atyidae",
  "Neritidae",
  "Ampullariidae",
  "Thiaridae",
]);

const longFinnedOrSlowSpeciesSlugs = new Set([
  "betta-splendens",
  "angelfish",
  "guppy",
  "sailfin-molly",
  "threadfin-rainbowfish",
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
  return species.family === "Tetraodontidae" || species.slug.includes("puffer");
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
    longFinnedOrSlowSpeciesSlugs.has(species.slug) ||
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
  if (!specialist.specialist_setup || !specialist.preferred_tank_style) {
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
    (speciesA.species_only_preferred &&
      !hasSpeciesSpecialRule(speciesA) &&
      speciesA.slug !== speciesB.slug) ||
    (speciesB.species_only_preferred &&
      !hasSpeciesSpecialRule(speciesB) &&
      speciesA.slug !== speciesB.slug)
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

function evaluateBehaviorRiskCaps(
  speciesA: SpeciesRow,
  speciesB: SpeciesRow,
): EvaluationResult {
  const caps: number[] = [];
  const reasons: string[] = [];
  const specialRuleEvaluation = evaluateSpeciesSpecialRules(speciesA, speciesB, {
    hasTag,
    isLongFinnedOrSlow,
    isPuffer,
    requiresGroup,
  });
  const hasSpecialPufferRule =
    specialRuleEvaluation != null &&
    (isPuffer(speciesA) || isPuffer(speciesB));

  if (specialRuleEvaluation) {
    if (specialRuleEvaluation.scoreCap != null) {
      caps.push(specialRuleEvaluation.scoreCap);
    }

    reasons.push(...specialRuleEvaluation.reasons);
  }

  if (!hasSpecialPufferRule && isPuffer(speciesA) !== isPuffer(speciesB)) {
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
  const evaluations = [
    evaluateTemperatureCompatibility(speciesA, speciesB),
    evaluatePhCompatibility(speciesA, speciesB),
    evaluateAggressionCompatibility(speciesA, speciesB),
    evaluateSchoolingCompatibility(speciesA, speciesB),
    evaluatePredationRisk(speciesA, speciesB),
    evaluateTankSizeCompatibility(speciesA, speciesB),
    evaluateTraitRiskCaps(speciesA, speciesB),
    evaluateBehaviorRiskCaps(speciesA, speciesB),
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
    expertValidated: false,
    species_a: toCompatibilitySpecies(speciesA),
    species_b: toCompatibilitySpecies(speciesB),
  };
}

import { createStaticClient } from "@/lib/supabase/static";
import type { Database } from "@/types/database.types";

type SpeciesRow = Database["public"]["Tables"]["species"]["Row"];

export type CompatibilitySpecies = {
  slug: string;
  common_name: string;
};

export type CompatibilityStatus =
  | "Overwhelmingly Compatible"
  | "Very Compatible"
  | "Compatible"
  | "Caution"
  | "Incompatible";

type EvaluationResult = {
  points: number;
  reasons: string[];
};

export type CompatibilityResult = {
  score: number;
  status: CompatibilityStatus;
  reasons: string[];

  compatibility: "compatible" | "caution" | "incompatible" | null;
  confidence: number | null;
  notes: string | null;

  species_a: CompatibilitySpecies;
  species_b: CompatibilitySpecies;
};

export type SpeciesCompatibilityGroup = {
  compatible: CompatibilityResult[];
  caution: CompatibilityResult[];
  incompatible: CompatibilityResult[];
};

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

function hasWaterParameterOverlap(
  speciesA: SpeciesRow,
  speciesB: SpeciesRow,
  minKey: "min_temp_f" | "min_ph",
  maxKey: "max_temp_f" | "max_ph",
) {
  const minA = speciesA[minKey];
  const maxA = speciesA[maxKey];
  const minB = speciesB[minKey];
  const maxB = speciesB[maxKey];

  if (minA == null || maxA == null || minB == null || maxB == null) {
    return true;
  }

  return Math.max(minA, minB) <= Math.min(maxA, maxB);
}

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

function toCompatibilitySpecies(species: SpeciesRow): CompatibilitySpecies {
  return {
    slug: species.slug,
    common_name: species.common_name,
  };
}

function determineStatus(score: number): CompatibilityStatus {
  if (score >= 96) {
    return "Overwhelmingly Compatible";
  }

  if (score >= 90) {
    return "Very Compatible";
  }

  if (score >= 70) {
    return "Compatible";
  }

  if (score >= 50) {
    return "Caution";
  }

  return "Incompatible";
}

function createEvaluation(
  points: number,
  ...reasons: string[]
): EvaluationResult {
  return {
    points,
    reasons,
  };
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

  if (overlap < 0) {
    return createEvaluation(0, "Temperature requirements conflict.");
  }

  if (overlap <= 2) {
    return createEvaluation(10, "Temperature ranges have limited overlap.");
  }

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

  if (overlap < 0) {
    return createEvaluation(0, "pH requirements conflict.");
  }

  if (overlap <= 0.3) {
    return createEvaluation(8, "pH ranges have limited overlap.");
  }

  return createEvaluation(
    COMPATIBILITY_WEIGHTS.ph,
    "pH requirements overlap well.",
  );
}

function getTemperamentScore(species: SpeciesRow) {
  if (species.temperament === "Aggressive") {
    return 2;
  }

  if (species.temperament === "Semi-Aggressive") {
    return 1;
  }

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

  if (!tankSizeA || !tankSizeB) {
    return createEvaluation(8, "Tank size data is incomplete.");
  }

  const tankSizeGap = Math.abs(tankSizeA - tankSizeB);

  if (tankSizeGap < 10) {
    return createEvaluation(
      COMPATIBILITY_WEIGHTS.tankSize,
      "Tank size requirements align.",
    );
  }

  if (tankSizeGap < 20) {
    return createEvaluation(8, "Tank size requirements differ slightly.");
  }

  if (tankSizeGap < 40) {
    return createEvaluation(5, "Tank size requirements differ moderately.");
  }

  return createEvaluation(
    0,
    "One species requires a significantly larger aquarium.",
  );
}

export function calculateCompatibility(
  speciesA: SpeciesRow,
  speciesB: SpeciesRow,
): CompatibilityResult {
  const blockers: string[] = [];
  const cautions: string[] = [];

  if (
    !hasWaterParameterOverlap(speciesA, speciesB, "min_temp_f", "max_temp_f")
  ) {
    blockers.push("temperature ranges do not overlap");
  }

  if (!hasWaterParameterOverlap(speciesA, speciesB, "min_ph", "max_ph")) {
    blockers.push("pH ranges do not overlap");
  }

  if (
    (isInvertebrate(speciesA) && speciesB.invert_safe === false) ||
    (isInvertebrate(speciesB) && speciesA.invert_safe === false)
  ) {
    blockers.push("one species is not safe with invertebrates");
  }

  if (
    canEatTankmate(speciesA, speciesB) ||
    canEatTankmate(speciesB, speciesA)
  ) {
    blockers.push("size and diet create a predation risk");
  }

  if (
    speciesA.temperament === "Aggressive" ||
    speciesB.temperament === "Aggressive"
  ) {
    blockers.push("aggressive temperament makes this pairing unsuitable");
  }

  const tankSizeGap = Math.abs(
    (speciesA.tank_size_gal ?? 0) - (speciesB.tank_size_gal ?? 0),
  );

  if (tankSizeGap >= 50) {
    cautions.push("tank size needs differ substantially");
  }

  if (
    speciesA.temperament === "Semi-Aggressive" ||
    speciesB.temperament === "Semi-Aggressive" ||
    (speciesA.aggression_level ?? 0) >= 4 ||
    (speciesB.aggression_level ?? 0) >= 4
  ) {
    cautions.push("territorial behavior may require extra space and cover");
  }

  const compatibility =
    blockers.length > 0
      ? "incompatible"
      : cautions.length > 0
        ? "caution"
        : "compatible";

  const notes =
    compatibility === "compatible"
      ? "Computed from species profile data: water parameters overlap and no major temperament, size, or invertebrate-safety conflicts were found."
      : `Computed from species profile data: ${[...blockers, ...cautions].join("; ")}.`;

  return {
    score:
      compatibility === "compatible"
        ? 100
        : compatibility === "caution"
          ? 60
          : 25,

    status: determineStatus(
      compatibility === "compatible"
        ? 100
        : compatibility === "caution"
          ? 60
          : 25,
    ),

    reasons:
      compatibility === "compatible"
        ? ["No major compatibility concerns detected."]
        : [...blockers, ...cautions],

    compatibility,
    confidence: 0.65,
    notes,
    species_a: toCompatibilitySpecies(speciesA),
    species_b: toCompatibilitySpecies(speciesB),
  };
}

export async function getCompatibilityRule(
  speciesASlug: string,
  speciesBSlug: string,
): Promise<CompatibilityResult | null> {
  const supabase = createStaticClient();

  const { data: species, error: speciesError } = await supabase
    .from("species")
    .select("*")
    .in("slug", [speciesASlug, speciesBSlug]);

  if (speciesError || !species || species.length !== 2) {
    return null;
  }

  const speciesA = species.find((item) => item.slug === speciesASlug);
  const speciesB = species.find((item) => item.slug === speciesBSlug);

  if (!speciesA || !speciesB) {
    return null;
  }

  const { data: rule, error } = await supabase
    .from("compatibility_rules")
    .select("compatibility, confidence, notes, species_a_id, species_b_id")
    .or(
      `and(species_a_id.eq.${speciesA.id},species_b_id.eq.${speciesB.id}),and(species_a_id.eq.${speciesB.id},species_b_id.eq.${speciesA.id})`,
    )
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch compatibility rule: ${error.message}`);
  }

  if (!rule) {
    return calculateCompatibility(speciesA, speciesB);
  }

  const compatibility =
    rule.compatibility as CompatibilityResult["compatibility"];

  const score = legacyCompatibilityToScore(compatibility);

  return {
    score: score,
    status: determineStatus(score),
    reasons: rule.notes ? [rule.notes] : ["Manual compatibility rule found."],
    compatibility: compatibility,
    confidence: rule.confidence,
    notes: rule.notes,
    species_a: speciesA,
    species_b: speciesB,
  };
}

export async function getCompatibilityRulesForSpecies(
  speciesSlug: string,
): Promise<SpeciesCompatibilityGroup> {
  const supabase = createStaticClient();

  const { data: species, error: speciesError } = await supabase
    .from("species")
    .select("*")
    .eq("slug", speciesSlug)
    .maybeSingle();

  if (speciesError || !species) {
    return {
      compatible: [],
      caution: [],
      incompatible: [],
    };
  }

  const { data: rules, error } = await supabase
    .from("compatibility_rules")
    .select(
      `
      compatibility,
      confidence,
      notes,
      species_a:species_a_id (
        slug,
        common_name
      ),
      species_b:species_b_id (
        slug,
        common_name
      )
    `,
    )
    .or(`species_a_id.eq.${species.id},species_b_id.eq.${species.id}`);

  if (error || !rules) {
    return {
      compatible: [],
      caution: [],
      incompatible: [],
    };
  }

  const grouped: SpeciesCompatibilityGroup = {
    compatible: [],
    caution: [],
    incompatible: [],
  };

  for (const rule of rules) {
    const speciesA = Array.isArray(rule.species_a)
      ? rule.species_a[0]
      : rule.species_a;

    const speciesB = Array.isArray(rule.species_b)
      ? rule.species_b[0]
      : rule.species_b;

    if (!speciesA || !speciesB) {
      continue;
    }

    const compatibility =
      rule.compatibility as CompatibilityResult["compatibility"];

    const score = legacyCompatibilityToScore(compatibility);

    const result: CompatibilityResult = {
      score,
      status: determineStatus(score),
      reasons: rule.notes ? [rule.notes] : ["Manual compatibility rule found."],
      compatibility: rule.compatibility as CompatibilityResult["compatibility"],
      confidence: rule.confidence,
      notes: rule.notes,
      species_a: {
        slug: speciesA.slug,
        common_name: speciesA.common_name,
      },
      species_b: {
        slug: speciesB.slug,
        common_name: speciesB.common_name,
      },
    };

    if (rule.compatibility === "compatible") {
      grouped.compatible.push(result);
    }

    if (rule.compatibility === "caution") {
      grouped.caution.push(result);
    }

    if (rule.compatibility === "incompatible") {
      grouped.incompatible.push(result);
    }
  }

  return grouped;
}

export async function getCompatibleSpeciesPairs() {
  const supabase = createStaticClient();

  const { data: species, error } = await supabase
    .from("species")
    .select("*")
    .order("common_name", { ascending: true });

  if (error) {
    throw new Error(
      `Failed to fetch species for compatibility: ${error.message}`,
    );
  }

  return species.map((speciesA) => ({
    species: toCompatibilitySpecies(speciesA),
    compatibleSpecies: species
      .filter((speciesB) => speciesB.id !== speciesA.id)
      .map((speciesB) => calculateCompatibility(speciesA, speciesB))
      .filter((result) => result.compatibility === "compatible")
      .map((result) => result.species_b),
  }));
}

function legacyCompatibilityToScore(
  compatibility: CompatibilityResult["compatibility"],
) {
  if (compatibility === "compatible") {
    return 100;
  }

  if (compatibility === "caution") {
    return 60;
  }

  if (compatibility === "incompatible") {
    return 25;
  }

  return 0;
}

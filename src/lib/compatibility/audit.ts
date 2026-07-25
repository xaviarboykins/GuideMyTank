import {
  calculateCompatibilityDiagnostics,
  legacyCompatibilityToScore,
} from "./engine";
import type {
  CompatibilityDiagnostics,
  CompatibilityResult,
  SpeciesRow,
} from "./types";

export type CompatibilityAuditFlagSeverity = "critical" | "high" | "medium" | "low";

export interface CompatibilityAuditFlag {
  code: string;
  severity: CompatibilityAuditFlagSeverity;
  message: string;
}

export interface CompatibilityAuditOverride {
  compatibility: CompatibilityResult["compatibility"];
  confidence: number | null;
  expertValidated: boolean;
  notes: string | null;
}

export interface CompatibilityAuditRegression {
  acceptable: CompatibilityResult["compatibility"][];
  note: string;
}

export interface CompatibilityPairAudit {
  pairKey: string;
  speciesA: {
    id: string;
    slug: string;
    commonName: string;
  };
  speciesB: {
    id: string;
    slug: string;
    commonName: string;
  };
  computed: {
    score: number;
    compatibility: CompatibilityResult["compatibility"];
    status: string;
    confidence: number | null;
    rawScore: number;
    scoreCap: number | null;
    evaluations: CompatibilityDiagnostics["evaluations"];
    findings: CompatibilityDiagnostics["findings"];
    legacyScore: number;
    legacyCompatibility: CompatibilityResult["compatibility"];
  };
  effective: {
    score: number;
    compatibility: CompatibilityResult["compatibility"];
    source: "computed" | "override";
    confidence: number | null;
    expertValidated: boolean;
    notes: string | null;
  };
  symmetry: {
    scoreMatches: boolean;
    classificationMatches: boolean;
  };
  evidence: {
    temperament: [string | null, string | null];
    aggressionLevel: [number | null, number | null];
    compatibilityTags: [string[], string[]];
    speciesOnlyPreferred: [boolean | null, boolean | null];
    finNippingRisk: [boolean | null, boolean | null];
    longFinVulnerable: [boolean | null, boolean | null];
    temperatureCategory: [string | null, string | null];
    missingEssentialFields: [string[], string[]];
  };
  flags: CompatibilityAuditFlag[];
}

const essentialFields = [
  "max_size_inches",
  "tank_size_gal",
  "min_temp_f",
  "max_temp_f",
  "min_ph",
  "max_ph",
  "temperament",
  "aggression_level",
] as const;

function missingEssentialFields(species: SpeciesRow) {
  return essentialFields.filter((field) => species[field] == null);
}

function hasTag(species: SpeciesRow, tag: string) {
  return species.compatibility_tags.some(
    (item) => item.toLowerCase() === tag,
  );
}

function isNonPeaceful(species: SpeciesRow) {
  return (
    species.temperament === "Semi-Aggressive" ||
    species.temperament === "Aggressive"
  );
}

function isFinNipper(species: SpeciesRow) {
  return (
    species.fin_nipping_risk === true ||
    hasTag(species, "fin_nipper") ||
    species.family === "Tetraodontidae"
  );
}

function isFinVulnerable(species: SpeciesRow) {
  return (
    species.long_fin_vulnerable === true ||
    species.slow_moving === true ||
    hasTag(species, "long_finned")
  );
}

function flag(
  flags: CompatibilityAuditFlag[],
  condition: boolean,
  code: string,
  severity: CompatibilityAuditFlagSeverity,
  message: string,
) {
  if (condition && !flags.some((item) => item.code === code)) {
    flags.push({ code, severity, message });
  }
}

export function getCompatibilityAuditPairKey(slugA: string, slugB: string) {
  return [slugA, slugB].sort().join("|");
}

export function auditCompatibilityPair(
  speciesA: SpeciesRow,
  speciesB: SpeciesRow,
  options: {
    override?: CompatibilityAuditOverride;
    regression?: CompatibilityAuditRegression;
  } = {},
): CompatibilityPairAudit {
  const forward = calculateCompatibilityDiagnostics(speciesA, speciesB);
  const reverse = calculateCompatibilityDiagnostics(speciesB, speciesA);
  const computed = forward.result;
  const flags: CompatibilityAuditFlag[] = [];
  const compatible = computed.compatibility === "compatible";
  const missingA = missingEssentialFields(speciesA);
  const missingB = missingEssentialFields(speciesB);

  flag(
    flags,
    forward.result.score !== reverse.result.score ||
      forward.result.compatibility !== reverse.result.compatibility,
    "asymmetric_result",
    "critical",
    "Pair ordering changes the computed compatibility result.",
  );
  flag(
    flags,
    compatible && isNonPeaceful(speciesA) && isNonPeaceful(speciesB),
    "compatible_two_nonpeaceful_species",
    "high",
    "Two semi-aggressive or aggressive species received an unconditional compatible result.",
  );
  flag(
    flags,
    compatible &&
      (speciesA.aggression_level ?? 0) + (speciesB.aggression_level ?? 0) >= 10,
    "compatible_high_combined_aggression",
    "high",
    "A compatible result has high combined structured aggression.",
  );
  flag(
    flags,
    compatible && hasTag(speciesA, "territorial") && hasTag(speciesB, "territorial"),
    "compatible_two_territorial_species",
    "high",
    "Two territorial species received an unconditional compatible result.",
  );
  flag(
    flags,
    compatible &&
      (speciesA.species_only_preferred === true ||
        speciesB.species_only_preferred === true),
    "compatible_species_only_preference",
    "critical",
    "A species-only preference did not prevent a compatible result.",
  );
  flag(
    flags,
    compatible &&
      ((isFinNipper(speciesA) && isFinVulnerable(speciesB)) ||
        (isFinNipper(speciesB) && isFinVulnerable(speciesA))),
    "compatible_fin_risk",
    "high",
    "Fin-nipping and fin-vulnerability traits exist in a compatible pair.",
  );
  flag(
    flags,
    compatible &&
      ((speciesA.temperature_category === "cool" &&
        speciesB.temperature_category === "warm") ||
        (speciesA.temperature_category === "warm" &&
          speciesB.temperature_category === "cool")),
    "compatible_temperature_category_conflict",
    "critical",
    "Cool-water and warm-water species received a compatible result.",
  );
  flag(
    flags,
    compatible && (missingA.length > 0 || missingB.length > 0),
    "compatible_with_missing_essential_data",
    "medium",
    "A compatible result was produced with missing essential structured data.",
  );
  flag(
    flags,
    Boolean(
      options.override &&
        options.override.compatibility !== computed.compatibility,
    ),
    "override_disagrees_with_engine",
    "medium",
    "The effective expert override disagrees with the generic engine.",
  );
  flag(
    flags,
    Boolean(
      options.regression &&
        !options.regression.acceptable.includes(computed.compatibility),
    ),
    "known_regression_failed",
    "critical",
    options.regression?.note ?? "A known regression produced an unacceptable result.",
  );

  const effectiveCompatibility =
    options.override?.compatibility ?? computed.compatibility;

  return {
    pairKey: getCompatibilityAuditPairKey(speciesA.slug, speciesB.slug),
    speciesA: {
      id: speciesA.id,
      slug: speciesA.slug,
      commonName: speciesA.common_name,
    },
    speciesB: {
      id: speciesB.id,
      slug: speciesB.slug,
      commonName: speciesB.common_name,
    },
    computed: {
      score: computed.score,
      compatibility: computed.compatibility,
      status: computed.status,
      confidence: computed.confidence,
      rawScore: forward.rawScore,
      scoreCap: forward.scoreCap,
      evaluations: forward.evaluations,
      findings: forward.findings,
      legacyScore: forward.legacyResult.score,
      legacyCompatibility: forward.legacyResult.compatibility,
    },
    effective: {
      score: options.override
        ? legacyCompatibilityToScore(options.override.compatibility)
        : computed.score,
      compatibility: effectiveCompatibility,
      source: options.override ? "override" : "computed",
      confidence: options.override?.confidence ?? computed.confidence,
      expertValidated: options.override?.expertValidated ?? false,
      notes: options.override?.notes ?? computed.notes,
    },
    symmetry: {
      scoreMatches: forward.result.score === reverse.result.score,
      classificationMatches:
        forward.result.compatibility === reverse.result.compatibility,
    },
    evidence: {
      temperament: [speciesA.temperament, speciesB.temperament],
      aggressionLevel: [speciesA.aggression_level, speciesB.aggression_level],
      compatibilityTags: [
        speciesA.compatibility_tags,
        speciesB.compatibility_tags,
      ],
      speciesOnlyPreferred: [
        speciesA.species_only_preferred,
        speciesB.species_only_preferred,
      ],
      finNippingRisk: [
        speciesA.fin_nipping_risk,
        speciesB.fin_nipping_risk,
      ],
      longFinVulnerable: [
        speciesA.long_fin_vulnerable,
        speciesB.long_fin_vulnerable,
      ],
      temperatureCategory: [
        speciesA.temperature_category,
        speciesB.temperature_category,
      ],
      missingEssentialFields: [missingA, missingB],
    },
    flags,
  };
}

import {
  compatibilityToPublicScore,
  determineStatus,
  getCompatibilityDataConfidence,
  getCompatibilityRecommendation,
  getCompatibilityVerdict,
} from "./engine";
import type {
  CompatibilityDiagnostics,
  CompatibilityReport,
  CompatibilityResult,
} from "./types";
import type { Database } from "@/types/database.types";

export type CompatibilityRuleRow =
  Database["public"]["Tables"]["compatibility_rules"]["Row"];

const COMPATIBILITY_VALUES = new Set<
  NonNullable<CompatibilityResult["compatibility"]>
>(["compatible", "caution", "incompatible"]);

function isCompatibilityValue(
  value: string,
): value is NonNullable<CompatibilityResult["compatibility"]> {
  return COMPATIBILITY_VALUES.has(
    value as NonNullable<CompatibilityResult["compatibility"]>,
  );
}

export function getCompatibilityPairKey(speciesAId: string, speciesBId: string) {
  return [speciesAId, speciesBId].sort().join(":");
}

export function createCompatibilityOverrideMap(
  rules: CompatibilityRuleRow[],
) {
  const overrides = new Map<string, CompatibilityRuleRow>();

  for (const rule of rules) {
    if (!rule.expert_validated || !isCompatibilityValue(rule.compatibility)) {
      continue;
    }

    const key = getCompatibilityPairKey(rule.species_a_id, rule.species_b_id);

    // Queries order newest records first. Keep the first reviewed rule if legacy
    // data contains both species orientations or duplicate rows.
    if (!overrides.has(key)) {
      overrides.set(key, rule);
    }
  }

  return overrides;
}

export function applyCompatibilityOverride(
  diagnostics: CompatibilityDiagnostics,
  rule?: CompatibilityRuleRow,
): Omit<CompatibilityReport, "analysis"> {
  const computedResult = diagnostics.result;

  if (
    !rule?.expert_validated ||
    !isCompatibilityValue(rule.compatibility)
  ) {
    return {
      ...diagnostics,
      computedResult,
      source: "computed",
      expertNotes: null,
      factors: groupCompatibilityFactors(diagnostics.findings),
      sources: [],
    };
  }

  const score = compatibilityToPublicScore(rule.compatibility);
  const expertNotes = rule.expert_notes?.trim() || rule.notes?.trim() || null;

  return {
    ...diagnostics,
    computedResult,
    result: {
      ...computedResult,
      score,
      status: determineStatus(score),
      compatibility: rule.compatibility,
      confidence: rule.confidence ?? computedResult.confidence,
      notes: expertNotes ?? computedResult.notes,
      expertValidated: true,
      verdict: getCompatibilityVerdict(rule.compatibility),
      recommendation: getCompatibilityRecommendation(rule.compatibility),
      dataConfidence: getCompatibilityDataConfidence(
        rule.confidence ?? computedResult.confidence,
      ),
    },
    source: "expert-override",
    expertNotes,
    factors: groupCompatibilityFactors(
      diagnostics.findings,
      rule.compatibility,
      true,
    ),
    sources: [],
  };
}

function groupCompatibilityFactors(
  findings: CompatibilityDiagnostics["findings"],
  effectiveCompatibility?: CompatibilityResult["compatibility"],
  expertOverride = false,
) {
  const errors = findings.filter((finding) => finding.severity === "error");
  const warnings = findings.filter((finding) => finding.severity === "warning");

  return {
    blockingRisks:
      expertOverride && effectiveCompatibility !== "incompatible" ? [] : errors,
    conditions:
      expertOverride && effectiveCompatibility !== "incompatible"
        ? [...errors, ...warnings]
        : warnings,
    supportingFactors: findings.filter(
      (finding) =>
        finding.severity === "info" &&
        !finding.message.startsWith("No structured") &&
        !finding.message.startsWith("No severe"),
    ),
  };
}

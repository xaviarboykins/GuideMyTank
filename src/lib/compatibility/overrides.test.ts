import { describe, expect, it } from "vitest";

import { calculateCompatibilityDiagnostics } from "./engine";
import {
  applyCompatibilityOverride,
  createCompatibilityOverrideMap,
  getCompatibilityPairKey,
  type CompatibilityRuleRow,
} from "./overrides";
import type { SpeciesRow } from "./types";

function species(id: string, slug: string): SpeciesRow {
  return {
    id,
    slug,
    common_name: slug,
    scientific_name: slug,
    compatibility_tags: ["community"],
    temperament: "Peaceful",
    aggression_level: 1,
    max_size_inches: 2,
    water_type: "Freshwater",
    min_temp_f: 72,
    max_temp_f: 78,
    min_ph: 6.5,
    max_ph: 7.5,
    min_school_size: 1,
    tank_size_gal: 20,
  } as unknown as SpeciesRow;
}

function rule(
  overrides: Partial<CompatibilityRuleRow> = {},
): CompatibilityRuleRow {
  return {
    id: "rule-1",
    species_a_id: "species-a",
    species_b_id: "species-b",
    compatibility: "incompatible",
    confidence: 0.95,
    notes: "Legacy note",
    expert_notes: "Reviewed because of predation risk.",
    expert_validated: true,
    created_at: "2026-09-29T00:00:00.000Z",
    ...overrides,
  };
}

describe("compatibility expert overrides", () => {
  const speciesA = species("species-a", "species-a");
  const speciesB = species("species-b", "species-b");
  const diagnostics = calculateCompatibilityDiagnostics(speciesA, speciesB);

  it("keeps the computed result when no reviewed override exists", () => {
    const report = applyCompatibilityOverride(diagnostics);

    expect(report.source).toBe("computed");
    expect(report.result).toEqual(diagnostics.result);
    expect(report.computedResult).toEqual(diagnostics.result);
  });

  it("applies a reviewed override without discarding computed diagnostics", () => {
    const report = applyCompatibilityOverride(diagnostics, rule());

    expect(report.source).toBe("expert-override");
    expect(report.result).toMatchObject({
      compatibility: "incompatible",
      score: 40,
      status: "Incompatible",
      confidence: 0.95,
      notes: "Reviewed because of predation risk.",
      expertValidated: true,
    });
    expect(report.computedResult).toEqual(diagnostics.result);
    expect(report.findings).toEqual(diagnostics.findings);
  });

  it("ignores unreviewed and invalid legacy override rows", () => {
    expect(
      applyCompatibilityOverride(
        diagnostics,
        rule({ expert_validated: false }),
      ).source,
    ).toBe("computed");
    expect(
      applyCompatibilityOverride(
        diagnostics,
        rule({ compatibility: "unknown" }),
      ).source,
    ).toBe("computed");
  });

  it("resolves the same reviewed rule for either species order", () => {
    const overrides = createCompatibilityOverrideMap([rule()]);
    const keyForward = getCompatibilityPairKey("species-a", "species-b");
    const keyReverse = getCompatibilityPairKey("species-b", "species-a");
    const forward = applyCompatibilityOverride(
      calculateCompatibilityDiagnostics(speciesA, speciesB),
      overrides.get(keyForward),
    );
    const reverse = applyCompatibilityOverride(
      calculateCompatibilityDiagnostics(speciesB, speciesA),
      overrides.get(keyReverse),
    );

    expect(keyForward).toBe(keyReverse);
    expect(overrides.get(keyForward)).toEqual(rule());
    expect(forward.result.compatibility).toBe("incompatible");
    expect(reverse.result.compatibility).toBe("incompatible");
    expect(forward.result.species_a.slug).toBe("species-a");
    expect(reverse.result.species_a.slug).toBe("species-b");
  });
});

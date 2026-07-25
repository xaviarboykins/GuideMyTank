import { describe, expect, it } from "vitest";

import {
  calculateCompatibility,
  calculateCompatibilityDiagnostics,
} from "./engine";
import type { SpeciesRow } from "./types";

function species(slug: string, overrides: Partial<SpeciesRow> = {}) {
  return {
    id: slug,
    slug,
    common_name: slug,
    scientific_name: slug,
    compatibility_tags: ["community"],
    temperament: "Peaceful",
    aggression_level: 1,
    max_size_inches: 2,
    tank_size_gal: 20,
    min_temp_f: 74,
    max_temp_f: 80,
    min_ph: 6,
    max_ph: 7.5,
    ...overrides,
  } as SpeciesRow;
}

describe("structured compatibility findings", () => {
  it("preserves the existing public result", () => {
    const speciesA = species("a");
    const speciesB = species("b");

    expect(
      calculateCompatibilityDiagnostics(speciesA, speciesB).result,
    ).toEqual(calculateCompatibility(speciesA, speciesB));
  });

  it("returns categorized evidence for every evaluator", () => {
    const diagnostics = calculateCompatibilityDiagnostics(
      species("a"),
      species("b"),
    );

    expect(diagnostics.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "temperature.aligned.1",
          category: "water-parameters",
          severity: "info",
          evidence: expect.objectContaining({
            evaluator: "temperature",
            maximumPoints: 20,
          }),
        }),
        expect.objectContaining({
          code: "predation.aligned.1",
          category: "predation",
        }),
      ]),
    );
  });

  it("surfaces missing essential data without changing the current result resolver", () => {
    const speciesA = species("a", {
      min_temp_f: null,
      max_temp_f: null,
      compatibility_tags: [],
    });
    const diagnostics = calculateCompatibilityDiagnostics(
      speciesA,
      species("b"),
    );

    expect(
      diagnostics.findings.map((finding) => finding.code),
    ).toEqual(
      expect.arrayContaining([
        "temperature.data_incomplete.1",
        "data-quality.missing.min_temp_f.a",
        "data-quality.missing.max_temp_f.a",
        "data-quality.missing.compatibility_tags.a",
      ]),
    );
    expect(diagnostics.result.compatibility).toBe(
      calculateCompatibility(speciesA, species("b")).compatibility,
    );
  });

  it("represents existing hard caps as error findings", () => {
    const diagnostics = calculateCompatibilityDiagnostics(
      species("warm", {
        min_temp_f: 78,
        max_temp_f: 82,
      }),
      species("cool", {
        min_temp_f: 60,
        max_temp_f: 70,
      }),
    );

    expect(diagnostics.findings).toContainEqual(
      expect.objectContaining({
        code: "temperature.constraint.1",
        category: "water-parameters",
        severity: "error",
        evidence: expect.objectContaining({ scoreCap: 45 }),
      }),
    );
  });

  it("prevents severe mutual aggression from returning compatible", () => {
    const diagnostics = calculateCompatibilityDiagnostics(
      species("aggressive-a", {
        temperament: "Aggressive",
        aggression_level: 7,
      }),
      species("aggressive-b", {
        temperament: "Aggressive",
        aggression_level: 8,
      }),
    );

    expect(diagnostics.legacyResult.compatibility).toBe("caution");
    expect(diagnostics.result.compatibility).toBe("incompatible");
    expect(diagnostics.result.score).toBeLessThan(50);
    expect(diagnostics.findings).toContainEqual(
      expect.objectContaining({
        code: "temperament.severe_mutual_aggression",
        severity: "error",
      }),
    );
  });

  it("does not present two non-peaceful species as unconditionally compatible", () => {
    const diagnostics = calculateCompatibilityDiagnostics(
      species("semi-aggressive-a", {
        temperament: "Semi-Aggressive",
        aggression_level: 4,
      }),
      species("semi-aggressive-b", {
        temperament: "Semi-Aggressive",
        aggression_level: 4,
      }),
    );

    expect(diagnostics.result.compatibility).toBe("caution");
    expect(diagnostics.result.score).toBe(60);
    expect(diagnostics.result.reasons).toContain(
      "Two non-peaceful species require cautious stocking, sufficient space, and close behavior monitoring.",
    );
  });

  it("prevents missing essential data from returning unconditionally compatible", () => {
    const diagnostics = calculateCompatibilityDiagnostics(
      species("incomplete", {
        aggression_level: null,
      }),
      species("complete"),
    );

    expect(diagnostics.legacyResult.compatibility).toBe("compatible");
    expect(diagnostics.result.compatibility).toBe("caution");
    expect(diagnostics.result.score).toBe(60);
  });

  it("uses general fields rather than Species slugs for hard constraints", () => {
    const first = calculateCompatibilityDiagnostics(
      species("first-a", {
        temperament: "Aggressive",
        aggression_level: 7,
      }),
      species("first-b", {
        temperament: "Aggressive",
        aggression_level: 7,
      }),
    );
    const second = calculateCompatibilityDiagnostics(
      species("unrelated-a", {
        temperament: "Aggressive",
        aggression_level: 7,
      }),
      species("unrelated-b", {
        temperament: "Aggressive",
        aggression_level: 7,
      }),
    );

    expect(first.result.compatibility).toBe("incompatible");
    expect(second.result.compatibility).toBe("incompatible");
    expect(first.result.score).toBe(second.result.score);
  });

  it("caps related territorial rivals without checking named Species", () => {
    const territorial = {
      family: "Exampleidae",
      compatibility_tags: ["territorial", "solitary", "top_water"],
      temperament: "Semi-Aggressive" as const,
      aggression_level: 6,
    };
    const tankmate = {
      family: "Exampleidae",
      compatibility_tags: ["community", "top_water"],
      aggression_level: 2,
    };

    const first = calculateCompatibilityDiagnostics(
      species("arbitrary-one", territorial),
      species("arbitrary-two", tankmate),
    );
    const second = calculateCompatibilityDiagnostics(
      species("different-one", territorial),
      species("different-two", tankmate),
    );

    expect(first.result.compatibility).toBe("caution");
    expect(first.result.score).toBe(60);
    expect(second.result.compatibility).toBe(first.result.compatibility);
    expect(second.result.score).toBe(first.result.score);
    expect(first.findings).toContainEqual(
      expect.objectContaining({
        code: "behavior_risk_caps.constraint.1",
        category: "temperament",
        severity: "warning",
      }),
    );
  });

  it("measures confidence from data completeness rather than score", () => {
    const sparse = calculateCompatibilityDiagnostics(
      species("sparse-a"),
      species("sparse-b"),
    ).result;
    const completeContext = {
      recommended_min_temp_f: 75,
      recommended_max_temp_f: 79,
      min_gh_dgh: 2,
      max_gh_dgh: 10,
      min_kh_dkh: 1,
      max_kh_dkh: 6,
      territory_zone: "mid",
      territory_footprint: "none",
      activity_level: "moderate",
      flow_preference: "moderate",
      preferred_tank_style: "community",
      temperature_category: "tropical",
    };
    const complete = calculateCompatibilityDiagnostics(
      species("complete-a", completeContext),
      species("complete-b", completeContext),
    ).result;

    expect(sparse.score).toBe(complete.score);
    expect(sparse.compatibility).toBe(complete.compatibility);
    expect(sparse.confidence).toBe(0.75);
    expect(complete.confidence).toBe(1);
  });

  it("can return high confidence for a well-documented incompatibility", () => {
    const completeContext = {
      recommended_min_temp_f: 75,
      recommended_max_temp_f: 79,
      min_gh_dgh: 2,
      max_gh_dgh: 10,
      min_kh_dkh: 1,
      max_kh_dkh: 6,
      territory_zone: "mid",
      territory_footprint: "none",
      activity_level: "moderate",
      flow_preference: "moderate",
      preferred_tank_style: "community",
      temperature_category: "tropical",
    };
    const result = calculateCompatibilityDiagnostics(
      species("warm", {
        ...completeContext,
        min_temp_f: 78,
        max_temp_f: 82,
        recommended_min_temp_f: 78,
        recommended_max_temp_f: 82,
      }),
      species("cool", {
        ...completeContext,
        min_temp_f: 60,
        max_temp_f: 70,
        recommended_min_temp_f: 60,
        recommended_max_temp_f: 70,
      }),
    ).result;

    expect(result.compatibility).toBe("incompatible");
    expect(result.confidence).toBe(1);
    expect(result.notes).toBe(
      "Structured species data identifies a serious conflict for this pairing.",
    );
  });

  it("keeps internal no-risk implementation messages out of public reasons", () => {
    const result = calculateCompatibilityDiagnostics(
      species("a"),
      species("b"),
    ).result;

    expect(result.reasons).not.toContain(
      "No structured trait override detected.",
    );
    expect(result.reasons).not.toContain(
      "No severe behavior override detected.",
    );
  });
});

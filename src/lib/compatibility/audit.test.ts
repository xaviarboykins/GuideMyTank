import { describe, expect, it } from "vitest";

import type { SpeciesRow } from "./types";
import { auditCompatibilityPair } from "./audit";

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

describe("compatibility audit", () => {
  it("does not flag two nonpeaceful species after the generic caution cap", () => {
    const result = auditCompatibilityPair(
      species("a", { temperament: "Semi-Aggressive" }),
      species("b", { temperament: "Semi-Aggressive" }),
    );

    expect(result.computed.compatibility).toBe("caution");
    expect(result.flags).toEqual([]);
  });

  it("flags a known regression outside its acceptable outcomes", () => {
    const result = auditCompatibilityPair(species("a"), species("b"), {
      regression: {
        acceptable: ["caution", "incompatible"],
        note: "Known unsafe pair.",
      },
    });

    expect(result.flags).toContainEqual(
      expect.objectContaining({ code: "known_regression_failed" }),
    );
  });

  it("reports generic and override disagreement without changing computation", () => {
    const result = auditCompatibilityPair(species("a"), species("b"), {
      override: {
        compatibility: "incompatible",
        confidence: 0.9,
        expertValidated: true,
        notes: "Expert block.",
      },
    });

    expect(result.computed.compatibility).toBe("compatible");
    expect(result.effective.compatibility).toBe("incompatible");
    expect(result.effective.source).toBe("override");
    expect(result.flags.map((item) => item.code)).toContain(
      "override_disagrees_with_engine",
    );
  });
});

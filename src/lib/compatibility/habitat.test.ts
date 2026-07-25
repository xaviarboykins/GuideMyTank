import { describe, expect, it } from "vitest";

import { calculateCompatibilityDiagnostics } from "./engine";
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
    min_temp_f: 72,
    max_temp_f: 80,
    min_ph: 6.5,
    max_ph: 7.5,
    ...overrides,
  } as SpeciesRow;
}

function expectCautionFor(
  overridesA: Partial<SpeciesRow>,
  overridesB: Partial<SpeciesRow>,
  reason: string,
) {
  const diagnostics = calculateCompatibilityDiagnostics(
    species("arbitrary-a", overridesA),
    species("arbitrary-b", overridesB),
  );

  expect(diagnostics.result.compatibility).toBe("caution");
  expect(diagnostics.result.score).toBe(60);
  expect(diagnostics.result.reasons).toContain(reason);
}

describe("freshwater habitat and setup constraints", () => {
  it("caps non-overlapping GH or KH requirements at caution", () => {
    expectCautionFor(
      { min_gh_dgh: 1, max_gh_dgh: 5 },
      { min_gh_dgh: 10, max_gh_dgh: 18 },
      "GH or KH ranges do not overlap well.",
    );
  });

  it("caps opposing low and high flow requirements at caution", () => {
    expectCautionFor(
      { flow_preference: "low" },
      { flow_preference: "high" },
      "Water flow preferences conflict.",
    );
  });

  it("caps cool-water and warm-water categories at caution", () => {
    expectCautionFor(
      { temperature_category: "cool" },
      { temperature_category: "warm" },
      "Cool-water and warm-water preferences conflict.",
    );
  });

  it("caps active feeders paired with vulnerable fish at caution", () => {
    expectCautionFor(
      { activity_level: "boisterous", competitive_feeder: true },
      { slow_moving: true },
      "Activity level or feeding speed may stress a slow, delicate, or long-finned species.",
    );
  });

  it("caps explicit incompatible specialist tank styles at caution", () => {
    expectCautionFor(
      { specialist_setup: true, preferred_tank_style: "stream" },
      { preferred_tank_style: "blackwater" },
      "Specialist tank style requirements need careful matching.",
    );
  });

  it("does not invent a specialist conflict when tank-style data is missing", () => {
    const diagnostics = calculateCompatibilityDiagnostics(
      species("specialist", {
        specialist_setup: true,
        preferred_tank_style: "stream",
      }),
      species("unknown-style", { preferred_tank_style: null }),
    );

    expect(diagnostics.result.compatibility).toBe("compatible");
    expect(diagnostics.result.reasons).not.toContain(
      "Specialist tank style requirements need careful matching.",
    );
  });

  it("does not infer an oxygen conflict without structured oxygen data", () => {
    const diagnostics = calculateCompatibilityDiagnostics(
      species("active", { activity_level: "active" }),
      species("calm", { activity_level: "calm" }),
    );

    expect(diagnostics.result.compatibility).toBe("compatible");
    expect(
      diagnostics.findings.some((finding) => finding.category === "oxygen"),
    ).toBe(false);
  });
});

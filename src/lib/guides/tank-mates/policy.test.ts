import { describe, expect, it } from "vitest";

import type { CompatibilityResult } from "../../compatibility/types";

import { groupTankMateRecommendations } from "./policy";

function result(
  name: string,
  compatibility: CompatibilityResult["compatibility"],
  confidence: number | null,
): CompatibilityResult {
  return {
    score: 70,
    status: compatibility === "compatible" ? "Compatible" : "Caution",
    reasons: [`${name} reason.`],
    compatibility,
    confidence,
    notes: null,
    expertValidated: false,
    species_a: { slug: "target", common_name: "Target" },
    species_b: { slug: name.toLowerCase(), common_name: name },
  };
}

describe("tank-mate recommendation policy", () => {
  it("separates classifications that meet the confidence threshold", () => {
    const groups = groupTankMateRecommendations([
      result("Compatible", "compatible", 0.9),
      result("Conditional", "caution", 0.8),
      result("Avoid", "incompatible", 0.95),
    ]);

    expect(groups.recommended).toHaveLength(1);
    expect(groups.conditional).toHaveLength(1);
    expect(groups.avoid).toHaveLength(1);
  });

  it("excludes low-confidence and unclassified results", () => {
    const groups = groupTankMateRecommendations([
      result("Low", "compatible", 0.74),
      result("Unknown", null, null),
    ]);

    expect(groups.recommended).toHaveLength(0);
    expect(groups.excludedLowConfidence).toHaveLength(2);
  });

  it("sorts by confidence and then species name", () => {
    const groups = groupTankMateRecommendations([
      result("Zebra", "compatible", 0.8),
      result("Alpha", "compatible", 0.9),
      result("Beta", "compatible", 0.8),
    ]);

    expect(
      groups.recommended.map((item) => item.species_b.common_name),
    ).toEqual(["Alpha", "Beta", "Zebra"]);
  });
});


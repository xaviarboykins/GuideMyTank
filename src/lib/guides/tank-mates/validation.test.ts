import { describe, expect, it } from "vitest";

import type { CompatibilityResult } from "../../compatibility/types";

import type { TankMateGuideData } from "./types";
import { validateTankMateGuideData } from "./validation";

function data(
  classification: CompatibilityResult["compatibility"],
): TankMateGuideData {
  return {
    targetSpecies: { id: "target" } as TankMateGuideData["targetSpecies"],
    candidates: [{ id: "candidate" }] as TankMateGuideData["candidates"],
    compatibilityResults: [
      {
        compatibility: classification,
        confidence: 0.9,
        species_b: { slug: "candidate", common_name: "Candidate" },
      } as CompatibilityResult,
    ],
    careGuides: [],
    sourceReferences: [],
  };
}

describe("tank-mate Guide validation", () => {
  it("requires a confident compatible result for tank-mate Guides", () => {
    expect(validateTankMateGuideData(data("compatible"), "tank-mates")).toEqual(
      { valid: true, issues: [] },
    );
    expect(
      validateTankMateGuideData(data("incompatible"), "tank-mates"),
    ).toMatchObject({ valid: false });
  });

  it("requires a confident incompatible result for avoid-with Guides", () => {
    expect(validateTankMateGuideData(data("incompatible"), "avoid-with")).toEqual(
      { valid: true, issues: [] },
    );
    expect(
      validateTankMateGuideData(data("compatible"), "avoid-with"),
    ).toMatchObject({ valid: false });
  });
});


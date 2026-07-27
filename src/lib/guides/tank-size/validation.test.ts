import { describe, expect, it } from "vitest";

import type { SpeciesRow } from "../../compatibility/types";

import type { TankSizeGuideData } from "./types";
import { validateTankSizeGuideData } from "./validation";

function data(speciesCount: number): TankSizeGuideData {
  return {
    species: Array.from({ length: speciesCount }, (_, index) => ({
      id: String(index),
      slug: String(index),
      common_name: String(index),
      scientific_name: String(index),
      tank_size_gal: 10,
      bioload_rating: 1,
      specialist_setup: false,
      species_only_preferred: false,
      compatibility_tags: ["community"],
    })) as SpeciesRow[],
    guidelines: [],
    careGuides: [],
    products: [],
  };
}

describe("tank-size Guide validation", () => {
  it("requires a positive whole-number volume", () => {
    expect(
      validateTankSizeGuideData(data(3), {
        gallons: 2.5,
        variation: "general",
      }),
    ).toMatchObject({ valid: false });
  });

  it("requires at least three suitable species", () => {
    expect(
      validateTankSizeGuideData(data(2), {
        gallons: 20,
        variation: "general",
      }),
    ).toMatchObject({ valid: false });
    expect(
      validateTankSizeGuideData(data(3), {
        gallons: 20,
        variation: "general",
      }),
    ).toEqual({ valid: true, issues: [] });
  });
});


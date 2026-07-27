import { describe, expect, it } from "vitest";

import type { SpeciesRow } from "../../compatibility/types";

import { evaluateTankSizeSuitability } from "./policy";

function species(slug: string, overrides: Partial<SpeciesRow> = {}) {
  return {
    id: slug,
    slug,
    common_name: slug,
    scientific_name: slug,
    compatibility_tags: ["community"],
    temperament: "Peaceful",
    tank_size_gal: 10,
    bioload_rating: 1,
    specialist_setup: false,
    species_only_preferred: false,
    ...overrides,
  } as SpeciesRow;
}

const emptyData = {
  guidelines: [],
  careGuides: [],
  products: [],
};

describe("tank-size suitability policy", () => {
  it("requires tank fit, a stocking profile, and a non-specialist setup", () => {
    const result = evaluateTankSizeSuitability(
      {
        ...emptyData,
        species: [
          species("suitable"),
          species("too-large", { tank_size_gal: 40 }),
          species("missing-profile", { bioload_rating: null }),
          species("specialist", { specialist_setup: true }),
        ],
      },
      { gallons: 20, variation: "general" },
    );

    expect(result.suitable.map((item) => item.slug)).toEqual(["suitable"]);
    expect(result.excludedMissingStockingProfile).toHaveLength(1);
    expect(result.excludedSpecialist).toHaveLength(1);
  });

  it("uses structured community traits for the community variation", () => {
    const result = evaluateTankSizeSuitability(
      {
        ...emptyData,
        species: [
          species("community-tag"),
          species("peaceful", {
            compatibility_tags: [],
            temperament: "Peaceful",
          }),
          species("species-only", { species_only_preferred: true }),
          species("aggressive", {
            compatibility_tags: [],
            temperament: "Aggressive",
          }),
        ],
      },
      { gallons: 20, variation: "community" },
    );

    expect(result.suitable.map((item) => item.slug)).toEqual([
      "community-tag",
      "peaceful",
    ]);
    expect(result.excludedByVariation).toHaveLength(2);
  });
});

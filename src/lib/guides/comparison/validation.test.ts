import { describe, expect, it } from "vitest";

import type { SpeciesRow } from "../../compatibility/types";

import type { ComparisonGuideData } from "./types";
import { validateComparisonGuideData } from "./validation";

const validSpecies = {
  id: "one",
  slug: "one",
  common_name: "One",
  scientific_name: "One fish",
  tank_size_gal: 10,
  min_temp_f: 72,
  max_temp_f: 78,
  min_ph: 6,
  max_ph: 7,
} as SpeciesRow;

function data(): ComparisonGuideData {
  return {
    speciesA: validSpecies,
    speciesB: { ...validSpecies, id: "two", slug: "two" },
    compatibility: {
      compatibility: "caution",
      confidence: 0.8,
    } as ComparisonGuideData["compatibility"],
    careGuides: [],
    sourceReferences: [],
  };
}

describe("Species comparison source-data validation", () => {
  it("accepts the required structured fields", () => {
    expect(validateComparisonGuideData(data())).toEqual({
      valid: true,
      issues: [],
    });
  });

  it("reports missing required source fields", () => {
    const input = data();
    input.speciesB = { ...input.speciesB, min_ph: null };

    expect(validateComparisonGuideData(input)).toMatchObject({
      valid: false,
      issues: [
        expect.objectContaining({
          field: "species.two.min_ph",
          code: "source_data_missing",
        }),
      ],
    });
  });
});


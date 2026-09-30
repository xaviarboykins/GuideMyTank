import { describe, expect, it } from "vitest";

import regressionPayload from "../../../data/compatibility/known-regressions.json";
import speciesPayload from "../../../data/import/species.master.json";
import { calculateCompatibility } from "./engine";
import type { CompatibilityResult, SpeciesRow } from "./types";

describe("reviewed compatibility regression matrix", () => {
  const speciesBySlug = new Map(
    speciesPayload.species.map((species) => [
      species.slug,
      species as unknown as SpeciesRow,
    ]),
  );

  for (const regression of regressionPayload.pairs) {
    it(`${regression.species[0]} with ${regression.species[1]}`, () => {
      const speciesA = speciesBySlug.get(regression.species[0]);
      const speciesB = speciesBySlug.get(regression.species[1]);

      expect(speciesA, `Missing ${regression.species[0]} source data`).toBeDefined();
      expect(speciesB, `Missing ${regression.species[1]} source data`).toBeDefined();

      const result = calculateCompatibility(speciesA!, speciesB!);

      expect(
        regression.acceptable as CompatibilityResult["compatibility"][],
        regression.note,
      ).toContain(result.compatibility);
    });
  }
});

import { describe, expect, it } from "vitest";

import type {
  AquariumResolvedLivestockEntry,
  AquariumSpecies,
} from "@/lib/aquarium-builder/types";

import {
  generateUniqueSpeciesPairs,
  getAquariumSpeciesPairKey,
} from "./pairs";

function livestock(id: string): AquariumResolvedLivestockEntry {
  return {
    speciesSlug: `slug-${id}`,
    quantity: 1,
    species: {
      id,
      slug: `slug-${id}`,
      common_name: `Species ${id}`,
    } as AquariumSpecies,
  };
}

describe("unique aquarium species pairs", () => {
  it("returns no pairs for empty and one-species builds", () => {
    expect(generateUniqueSpeciesPairs([])).toEqual([]);
    expect(generateUniqueSpeciesPairs([livestock("a")])).toEqual([]);
  });

  it("generates exactly three pairs for three unique species", () => {
    const pairs = generateUniqueSpeciesPairs([
      livestock("c"),
      livestock("a"),
      livestock("b"),
    ]);

    expect(pairs.map((pair) => pair.key)).toEqual(["a:b", "a:c", "b:c"]);
  });

  it("does not create self-pairs for duplicate livestock entries", () => {
    const pairs = generateUniqueSpeciesPairs([
      livestock("a"),
      livestock("a"),
      livestock("b"),
    ]);

    expect(pairs).toHaveLength(1);
    expect(pairs[0].key).toBe("a:b");
  });

  it("is independent of input and pair order", () => {
    expect(getAquariumSpeciesPairKey("b", "a")).toBe("a:b");
    expect(
      generateUniqueSpeciesPairs([livestock("b"), livestock("a")]).map(
        (pair) => pair.key,
      ),
    ).toEqual(
      generateUniqueSpeciesPairs([livestock("a"), livestock("b")]).map(
        (pair) => pair.key,
      ),
    );
  });
});

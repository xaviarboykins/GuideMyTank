import { describe, expect, it } from "vitest";

import {
  defaultAquariumBuild,
  normalizeAquariumPlants,
  parseAquariumBuild,
  serializeAquariumBuild,
} from "./storage";

describe("aquarium builder plant storage", () => {
  it("preserves stable plant IDs and quantities through serialization", () => {
    const serialized = serializeAquariumBuild({
      ...defaultAquariumBuild,
      plants: [
        { plantId: "plant-1", quantity: 2 },
        { plantId: "plant-2", quantity: 4 },
      ],
    });

    expect(parseAquariumBuild(serialized).plants).toEqual([
      { plantId: "plant-1", quantity: 2, notes: null },
      { plantId: "plant-2", quantity: 4, notes: null },
    ]);
  });

  it("merges duplicate IDs consistently with livestock storage", () => {
    expect(
      normalizeAquariumPlants([
        { plantId: "plant-1", quantity: 2 },
        { plantId: "plant-1", quantity: 3 },
      ]),
    ).toEqual([{ plantId: "plant-1", quantity: 5, notes: null }]);
  });

  it("drops legacy slug-only rows instead of retaining unstable identifiers", () => {
    expect(
      normalizeAquariumPlants([{ plantSlug: "java-fern", quantity: 2 }]),
    ).toEqual([]);
  });
});

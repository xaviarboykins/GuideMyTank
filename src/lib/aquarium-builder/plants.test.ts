import { describe, expect, it } from "vitest";

import {
  calculatePlantedLevel,
  calculatePlantQuantity,
  removeAquariumPlantEntry,
  updateAquariumPlantEntry,
} from "./plants";

function plants(...quantities: number[]) {
  return quantities.map((quantity, index) => ({
    plantId: `plant-${index + 1}`,
    quantity,
  }));
}

describe("aquarium plant selection", () => {
  it("adds a plant by stable database ID", () => {
    expect(updateAquariumPlantEntry([], " plant-1 ", 2)).toEqual([
      { plantId: "plant-1", quantity: 2, notes: null },
    ]);
  });

  it("updates an existing quantity without creating a duplicate row", () => {
    expect(
      updateAquariumPlantEntry(
        [{ plantId: "plant-1", quantity: 2 }],
        "plant-1",
        5,
      ),
    ).toEqual([{ plantId: "plant-1", quantity: 5 }]);
  });

  it.each([0, -3, 1.8, Number.NaN, Number.POSITIVE_INFINITY])(
    "normalizes invalid quantity %s to a positive integer",
    (quantity) => {
      expect(updateAquariumPlantEntry([], "plant-1", quantity)[0].quantity).toBe(
        1,
      );
    },
  );

  it("ignores a missing plant ID", () => {
    const plants = [{ plantId: "plant-1", quantity: 2 }];

    expect(updateAquariumPlantEntry(plants, "  ", 4)).toBe(plants);
  });

  it("removes a selected plant", () => {
    expect(
      removeAquariumPlantEntry(
        [
          { plantId: "plant-1", quantity: 2 },
          { plantId: "plant-2", quantity: 3 },
        ],
        "plant-1",
      ),
    ).toEqual([{ plantId: "plant-2", quantity: 3 }]);
  });
});

describe("calculatePlantedLevel", () => {
  it("returns none for a missing or empty plant list", () => {
    expect(calculatePlantedLevel(undefined, 20)).toBe("none");
    expect(calculatePlantedLevel(null, 20)).toBe("none");
    expect(calculatePlantedLevel([], 20)).toBe("none");
  });

  it.each([
    [0, "none"],
    [1, "light"],
    [3, "light"],
    [4, "light"],
    [7, "moderate"],
    [8, "moderate"],
  ] as const)(
    "maps %s total plants in a 20 gallon tank to %s",
    (quantity, expected) => {
      expect(calculatePlantedLevel(plants(quantity), 20)).toBe(expected);
    },
  );

  it("uses exact density boundaries", () => {
    expect(calculatePlantedLevel(plants(5), 20)).toBe("moderate");
    expect(calculatePlantedLevel(plants(10), 20)).toBe("heavy");
  });

  it("sums multiple species when they cross a threshold", () => {
    expect(calculatePlantedLevel(plants(2, 3), 20)).toBe("moderate");
  });

  it("ignores zero, negative, fractional, and non-finite quantities", () => {
    expect(
      calculatePlantQuantity(
        plants(0, -2, 1.5, Number.NaN, Number.POSITIVE_INFINITY, 3),
      ),
    ).toBe(3);
    expect(
      calculatePlantedLevel(
        plants(0, -2, 1.5, Number.NaN, Number.POSITIVE_INFINITY),
        20,
      ),
    ).toBe("none");
  });

  it("returns light when plants exist without a usable tank volume", () => {
    expect(calculatePlantedLevel(plants(8), 0)).toBe("light");
    expect(calculatePlantedLevel(plants(8), undefined)).toBe("light");
  });

  it("preserves an explicit planted level", () => {
    expect(calculatePlantedLevel(plants(1), 100, "heavy")).toBe("heavy");
  });

  it("updates after a selected plant is removed", () => {
    const selectedPlants = plants(5, 5);
    const remainingPlants = removeAquariumPlantEntry(
      selectedPlants,
      "plant-2",
    );

    expect(calculatePlantedLevel(selectedPlants, 20)).toBe("heavy");
    expect(calculatePlantedLevel(remainingPlants, 20)).toBe("moderate");
  });

  it("is deterministic for the same selections in different row orders", () => {
    expect(calculatePlantedLevel(plants(2, 3), 20)).toBe(
      calculatePlantedLevel(plants(3, 2), 20),
    );
  });
});

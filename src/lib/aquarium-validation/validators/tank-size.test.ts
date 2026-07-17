import { describe, expect, it } from "vitest";

import type {
  AquariumBuild,
  AquariumResolvedLivestockEntry,
  AquariumSpecies,
} from "@/lib/aquarium-builder/types";

import { AQUARIUM_VALIDATION_CODES } from "../constants";
import type { AquariumValidatorContext } from "../types";
import { tankSizeValidator } from "./tank-size";

function build(tankGallons: number): AquariumBuild {
  return {
    tank: {
      sizeGallons: tankGallons,
      filtrationLevel: "standard",
      plantedLevel: "none",
    },
    livestock: [],
    plants: [],
    equipment: [],
  };
}

function livestock(
  id: string,
  minimumTankGallons: number | null,
): AquariumResolvedLivestockEntry {
  return {
    speciesSlug: `slug-${id}`,
    quantity: 1,
    species: {
      id,
      slug: `slug-${id}`,
      common_name: `Species ${id}`,
      tank_size_gal: minimumTankGallons,
    } as AquariumSpecies,
  };
}

function context(
  tankGallons: number,
  species: AquariumResolvedLivestockEntry[] = [],
): AquariumValidatorContext {
  return {
    input: build(tankGallons),
    species,
    speciesPairs: [],
    compatibilityResults: [],
    stockingAnalysis: null,
  };
}

describe("tankSizeValidator", () => {
  it.each([0, -1, Number.NaN])(
    "returns info when tank volume %s is unavailable",
    async (tankGallons) => {
      const issues = await tankSizeValidator.validate(
        context(tankGallons, [livestock("a", 20)]),
      );

      expect(issues).toHaveLength(1);
      expect(issues[0]).toMatchObject({
        code: AQUARIUM_VALIDATION_CODES.tankNotSelected,
        severity: "info",
        affectedSpeciesIds: ["a"],
      });
    },
  );

  it("returns an error below a documented species minimum", async () => {
    const issues = await tankSizeValidator.validate(
      context(10, [livestock("a", 20)]),
    );

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      code: AQUARIUM_VALIDATION_CODES.tankBelowSpeciesMinimum,
      severity: "error",
      affectedSpeciesIds: ["a"],
      metadata: {
        selectedTankGallons: 10,
        minimumTankGallons: 20,
      },
    });
  });

  it("returns info exactly at a documented minimum", async () => {
    const issues = await tankSizeValidator.validate(
      context(20, [livestock("a", 20)]),
    );

    expect(issues).toHaveLength(1);
    expect(issues[0].code).toBe(AQUARIUM_VALIDATION_CODES.tankAtMinimum);
    expect(issues[0].severity).toBe("info");
  });

  it("returns no issue above the documented minimum", async () => {
    await expect(
      tankSizeValidator.validate(context(30, [livestock("a", 20)])),
    ).resolves.toEqual([]);
  });

  it("skips species with missing or invalid minimum data", async () => {
    await expect(
      tankSizeValidator.validate(
        context(20, [livestock("a", null), livestock("b", 0)]),
      ),
    ).resolves.toEqual([]);
  });

  it("emits only one finding for duplicate species entries", async () => {
    const issues = await tankSizeValidator.validate(
      context(10, [livestock("a", 20), livestock("a", 20)]),
    );

    expect(issues).toHaveLength(1);
  });

  it("can report multiple species below their minimums", async () => {
    const issues = await tankSizeValidator.validate(
      context(10, [livestock("b", 30), livestock("a", 20)]),
    );

    expect(issues).toHaveLength(2);
    expect(issues.map((issue) => issue.affectedSpeciesIds[0])).toEqual([
      "a",
      "b",
    ]);
  });
});

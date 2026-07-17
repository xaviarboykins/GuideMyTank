import { describe, expect, it } from "vitest";

import type {
  AquariumBuild,
  AquariumResolvedLivestockEntry,
  AquariumSpecies,
} from "@/lib/aquarium-builder/types";

import { AQUARIUM_VALIDATION_CODES } from "../constants";
import type { AquariumValidatorContext } from "../types";
import { schoolSizeValidator } from "./school-size";

const build: AquariumBuild = {
  tank: {
    sizeGallons: 20,
    filtrationLevel: "standard",
    plantedLevel: "none",
  },
  livestock: [],
  plants: [],
  equipment: [],
};

function livestock(
  id: string,
  quantity: number,
  minimumGroupSize: number | null,
): AquariumResolvedLivestockEntry {
  return {
    speciesSlug: `slug-${id}`,
    quantity,
    species: {
      id,
      slug: `slug-${id}`,
      common_name: `Species ${id}`,
      min_group_size: minimumGroupSize,
    } as AquariumSpecies,
  };
}

function context(
  species: AquariumResolvedLivestockEntry[],
): AquariumValidatorContext {
  return {
    input: build,
    species,
    speciesPairs: [],
    compatibilityResults: [],
    stockingAnalysis: null,
  };
}

describe("schoolSizeValidator", () => {
  it("returns a warning below the documented minimum", async () => {
    const issues = await schoolSizeValidator.validate(
      context([livestock("tetra", 3, 6)]),
    );

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      code: AQUARIUM_VALIDATION_CODES.schoolSizeBelowMinimum,
      severity: "warning",
      affectedSpeciesIds: ["tetra"],
      metadata: {
        currentQuantity: 3,
        recommendedMinimum: 6,
        quantityNeeded: 3,
      },
    });
  });

  it.each([6, 7])(
    "returns no issue at or above quantity %s",
    async (quantity) => {
      await expect(
        schoolSizeValidator.validate(
          context([livestock("tetra", quantity, 6)]),
        ),
      ).resolves.toEqual([]);
    },
  );

  it("skips missing or invalid minimum group data", async () => {
    await expect(
      schoolSizeValidator.validate(
        context([
          livestock("unknown", 1, null),
          livestock("invalid", 1, 0),
        ]),
      ),
    ).resolves.toEqual([]);
  });

  it("aggregates duplicate livestock entries before checking quantity", async () => {
    await expect(
      schoolSizeValidator.validate(
        context([livestock("tetra", 3, 6), livestock("tetra", 3, 6)]),
      ),
    ).resolves.toEqual([]);
  });

  it("reports each undersized species once in stable species order", async () => {
    const issues = await schoolSizeValidator.validate(
      context([livestock("b", 1, 4), livestock("a", 2, 5)]),
    );

    expect(issues.map((issue) => issue.affectedSpeciesIds[0])).toEqual([
      "a",
      "b",
    ]);
  });

  it("returns no issues for empty livestock", async () => {
    await expect(schoolSizeValidator.validate(context([]))).resolves.toEqual(
      [],
    );
  });
});

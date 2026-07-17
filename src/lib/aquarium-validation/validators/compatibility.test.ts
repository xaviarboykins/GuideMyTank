import { describe, expect, it } from "vitest";

import type {
  AquariumBuild,
  AquariumResolvedLivestockEntry,
  AquariumSpecies,
} from "@/lib/aquarium-builder/types";
import type { CompatibilityResult } from "@/lib/compatibility/types";

import { AQUARIUM_VALIDATION_CODES } from "../constants";
import type {
  AquariumValidatorContext,
  ResolvedCompatibilityResult,
} from "../types";
import { compatibilityValidator } from "./compatibility";

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

function result(
  compatibility: CompatibilityResult["compatibility"],
): CompatibilityResult {
  return {
    score:
      compatibility === "compatible"
        ? 90
        : compatibility === "caution"
          ? 60
          : 20,
    status:
      compatibility === "compatible"
        ? "Very Compatible"
        : compatibility === "caution"
          ? "Caution"
          : "Incompatible",
    reasons: [],
    compatibility,
    confidence: 0.9,
    notes: null,
    expertValidated: false,
    species_a: { slug: "slug-a", common_name: "Species a" },
    species_b: { slug: "slug-b", common_name: "Species b" },
  };
}

function context(
  compatibilityResult: ResolvedCompatibilityResult,
): AquariumValidatorContext {
  return {
    input: build,
    species: [livestock("a"), livestock("b")],
    speciesPairs: [],
    compatibilityResults: [compatibilityResult],
    stockingAnalysis: null,
  };
}

describe("compatibilityValidator", () => {
  it("returns no issue for a compatible pair", async () => {
    await expect(
      compatibilityValidator.validate(
        context({ speciesAId: "a", speciesBId: "b", result: result("compatible") }),
      ),
    ).resolves.toEqual([]);
  });

  it("maps caution to a warning", async () => {
    const issues = await compatibilityValidator.validate(
      context({ speciesAId: "a", speciesBId: "b", result: result("caution") }),
    );

    expect(issues[0]).toMatchObject({
      code: AQUARIUM_VALIDATION_CODES.compatibilityCaution,
      severity: "warning",
      affectedSpeciesIds: ["a", "b"],
    });
  });

  it("maps incompatible to an error", async () => {
    const issues = await compatibilityValidator.validate(
      context({
        speciesAId: "b",
        speciesBId: "a",
        result: result("incompatible"),
      }),
    );

    expect(issues[0]).toMatchObject({
      code: AQUARIUM_VALIDATION_CODES.compatibilityIncompatible,
      severity: "error",
      affectedSpeciesIds: ["a", "b"],
    });
  });

  it.each([null, result(null)])(
    "maps unavailable or unknown results to info",
    async (compatibilityResult) => {
      const issues = await compatibilityValidator.validate(
        context({
          speciesAId: "a",
          speciesBId: "b",
          result: compatibilityResult,
        }),
      );

      expect(issues[0]).toMatchObject({
        code: AQUARIUM_VALIDATION_CODES.compatibilityUnknown,
        severity: "info",
      });
    },
  );
});

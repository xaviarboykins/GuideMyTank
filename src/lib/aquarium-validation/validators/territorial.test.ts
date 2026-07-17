import { describe, expect, it } from "vitest";

import type {
  AquariumBuild,
  AquariumResolvedLivestockEntry,
  AquariumSpecies,
} from "@/lib/aquarium-builder/types";
import type { CompatibilityResult } from "@/lib/compatibility/types";

import { AQUARIUM_VALIDATION_CODES } from "../constants";
import type { AquariumValidatorContext } from "../types";
import { territorialValidator } from "./territorial";

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
  quantity = 1,
  overrides: Partial<AquariumSpecies> = {},
): AquariumResolvedLivestockEntry {
  return {
    speciesSlug: `slug-${id}`,
    quantity,
    species: {
      id,
      slug: `slug-${id}`,
      common_name: `Species ${id}`,
      compatibility_tags: [],
      aggression_level: null,
      temperament: null,
      breeding_aggression: false,
      species_only_preferred: false,
      ...overrides,
    } as AquariumSpecies,
  };
}

function result(
  compatibility: "caution" | "incompatible",
  reasons: string[],
): CompatibilityResult {
  return {
    score: compatibility === "incompatible" ? 35 : 60,
    status: compatibility === "incompatible" ? "Incompatible" : "Caution",
    reasons,
    compatibility,
    confidence: 0.9,
    notes: null,
    expertValidated: false,
    species_a: { slug: "slug-a", common_name: "Species a" },
    species_b: { slug: "slug-b", common_name: "Species b" },
  };
}

function context(
  species: AquariumResolvedLivestockEntry[],
  compatibilityResult: CompatibilityResult | null = null,
): AquariumValidatorContext {
  return {
    input: build,
    species,
    speciesPairs: [],
    compatibilityResults: compatibilityResult
      ? [{ speciesAId: "a", speciesBId: "b", result: compatibilityResult }]
      : [],
    stockingAnalysis: null,
  };
}

describe("territorialValidator", () => {
  it("warns for multiple solitary territorial aggressive individuals", async () => {
    const issues = await territorialValidator.validate(
      context([
        livestock("a", 2, {
          compatibility_tags: ["territorial", "solitary"],
          aggression_level: 6,
        }),
      ]),
    );

    expect(issues[0]).toMatchObject({
      code: AQUARIUM_VALIDATION_CODES.territorialSameSpeciesConflict,
      severity: "warning",
      affectedSpeciesIds: ["a"],
      metadata: { currentQuantity: 2, aggressionLevel: 6 },
    });
  });

  it("aggregates duplicate same-species quantities", async () => {
    const territorial = {
      compatibility_tags: ["territorial", "solitary"],
      temperament: "Aggressive",
    } satisfies Partial<AquariumSpecies>;
    const issues = await territorialValidator.validate(
      context([
        livestock("a", 1, territorial),
        livestock("a", 1, territorial),
      ]),
    );

    expect(issues).toHaveLength(1);
    expect(issues[0].metadata).toMatchObject({ currentQuantity: 2 });
  });

  it.each([
    [1, ["territorial", "solitary"], 7],
    [2, ["territorial"], 7],
    [2, ["solitary"], 7],
    [2, ["territorial", "solitary"], 2],
  ] as const)(
    "does not overstate unsupported same-species risk",
    async (quantity, tags, aggressionLevel) => {
      await expect(
        territorialValidator.validate(
          context([
            livestock("a", quantity, {
              compatibility_tags: [...tags],
              aggression_level: aggressionLevel,
            }),
          ]),
        ),
      ).resolves.toEqual([]);
    },
  );

  it("maps incompatible territorial service evidence to an error", async () => {
    const issues = await territorialValidator.validate(
      context(
        [livestock("a"), livestock("b")],
        result("incompatible", [
          "Both species defend territory aggressively and may injure each other.",
        ]),
      ),
    );

    expect(issues[0]).toMatchObject({
      code: AQUARIUM_VALIDATION_CODES.territorialPairConflict,
      severity: "error",
      affectedSpeciesIds: ["a", "b"],
    });
  });

  it("maps caution breeding-aggression evidence to a warning", async () => {
    const issues = await territorialValidator.validate(
      context(
        [livestock("a"), livestock("b")],
        result("caution", [
          "Breeding aggression can make this pairing territorial.",
        ]),
      ),
    );

    expect(issues[0]).toMatchObject({
      code: AQUARIUM_VALIDATION_CODES.territorialPairConflict,
      severity: "warning",
    });
  });

  it("does not infer territorial conflict from generic incompatibility", async () => {
    await expect(
      territorialValidator.validate(
        context(
          [livestock("a"), livestock("b")],
          result("incompatible", ["The water ranges do not overlap."]),
        ),
      ),
    ).resolves.toEqual([]);
  });
});

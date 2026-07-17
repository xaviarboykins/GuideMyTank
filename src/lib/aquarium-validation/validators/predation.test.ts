import { describe, expect, it } from "vitest";

import type {
  AquariumBuild,
  AquariumResolvedLivestockEntry,
  AquariumSpecies,
} from "@/lib/aquarium-builder/types";
import type { CompatibilityResult } from "@/lib/compatibility/types";

import { AQUARIUM_VALIDATION_CODES } from "../constants";
import type { AquariumValidatorContext } from "../types";
import { predationValidator } from "./predation";

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
      compatibility_tags: [],
    } as unknown as AquariumSpecies,
  };
}

function compatibilityResult(
  compatibility: CompatibilityResult["compatibility"],
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

function context(result: CompatibilityResult): AquariumValidatorContext {
  return {
    input: build,
    species: [livestock("a"), livestock("b")],
    speciesPairs: [],
    compatibilityResults: [{ speciesAId: "a", speciesBId: "b", result }],
    stockingAnalysis: null,
  };
}

describe("predationValidator", () => {
  it("maps explicit incompatible predation evidence to an error", async () => {
    const issues = await predationValidator.validate(
      context(
        compatibilityResult("incompatible", [
          "Size and diet create a predation risk.",
        ]),
      ),
    );

    expect(issues[0]).toMatchObject({
      code: AQUARIUM_VALIDATION_CODES.predationHighRisk,
      severity: "error",
      affectedSpeciesIds: ["a", "b"],
    });
  });

  it("maps explicit caution predation evidence to a warning", async () => {
    const issues = await predationValidator.validate(
      context(
        compatibilityResult("caution", [
          "This species may eat sufficiently small tankmates.",
        ]),
      ),
    );

    expect(issues[0]).toMatchObject({
      code: AQUARIUM_VALIDATION_CODES.predationPossible,
      severity: "warning",
    });
  });

  it("recognizes the existing invertebrate-safety evidence", async () => {
    const issues = await predationValidator.validate(
      context(
        compatibilityResult("incompatible", [
          "One species is not safe with invertebrates.",
        ]),
      ),
    );

    expect(issues[0].code).toBe(
      AQUARIUM_VALIDATION_CODES.predationHighRisk,
    );
  });

  it("does not infer predation from incompatibility or size language alone", async () => {
    await expect(
      predationValidator.validate(
        context(
          compatibilityResult("incompatible", [
            "One species requires a significantly larger aquarium.",
          ]),
        ),
      ),
    ).resolves.toEqual([]);
  });

  it("ignores the Compatibility Engine's explicit no-risk reason", async () => {
    await expect(
      predationValidator.validate(
        context(
          compatibilityResult("caution", ["No predation risk detected."]),
        ),
      ),
    ).resolves.toEqual([]);
  });

  it("does not contradict a compatible service result", async () => {
    await expect(
      predationValidator.validate(
        context(
          compatibilityResult("compatible", [
            "No predation risk detected.",
          ]),
        ),
      ),
    ).resolves.toEqual([]);
  });
});

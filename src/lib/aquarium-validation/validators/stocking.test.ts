import { describe, expect, it } from "vitest";

import type {
  AquariumBuild,
  AquariumResolvedLivestockEntry,
  AquariumSpecies,
} from "@/lib/aquarium-builder/types";
import { analyzeStocking } from "../../aquarium-builder/stocking-analysis/engine";
import type {
  StockingAnalysisInput,
  StockingAnalysisResult,
} from "@/lib/aquarium-builder/stocking-analysis/types";

import { AQUARIUM_VALIDATION_CODES } from "../constants";
import { validateAquarium } from "../engine";
import type { AquariumValidatorContext } from "../types";
import { stockingValidator } from "./stocking";

const build: AquariumBuild = {
  tank: {
    sizeGallons: 100,
    filtrationLevel: "standard",
    plantedLevel: "none",
  },
  livestock: [],
  plants: [],
  equipment: [],
};

function stockingInput(quantity: number): StockingAnalysisInput {
  return {
    tankGallons: 100,
    filtrationLevel: "standard",
    plantedLevel: "none",
    livestock: [
      {
        speciesId: "species-a",
        speciesName: "Species A",
        quantity,
        bioloadScore: 10,
      },
    ],
  };
}

function context(
  stockingAnalysis: StockingAnalysisResult | null | undefined,
): AquariumValidatorContext {
  return {
    input: build,
    species: [],
    speciesPairs: [],
    compatibilityResults: [],
    stockingAnalysis,
  };
}

describe("stockingValidator", () => {
  it.each([
    [1, "lightly-stocked"],
    [5, "moderately-stocked"],
  ] as const)("returns no issue for %s0%% %s", async (quantity, status) => {
    const analysis = analyzeStocking(stockingInput(quantity));

    expect(analysis.stockingStatus).toBe(status);
    await expect(
      stockingValidator.validate(context(analysis)),
    ).resolves.toEqual([]);
  });

  it("maps fully stocked to a warning", async () => {
    const analysis = analyzeStocking(stockingInput(8));
    const issues = await stockingValidator.validate(context(analysis));

    expect(analysis.stockingStatus).toBe("fully-stocked");
    expect(issues[0]).toMatchObject({
      code: AQUARIUM_VALIDATION_CODES.stockingFull,
      severity: "warning",
      metadata: {
        stockingStatus: "fully-stocked",
        stockingPercentage: 80,
      },
    });
  });

  it("maps overstocked to an error", async () => {
    const analysis = analyzeStocking(stockingInput(12));
    const issues = await stockingValidator.validate(context(analysis));

    expect(analysis.stockingStatus).toBe("overstocked");
    expect(issues[0]).toMatchObject({
      code: AQUARIUM_VALIDATION_CODES.stockingOverCapacity,
      severity: "error",
      metadata: {
        stockingStatus: "overstocked",
        stockingPercentage: 120,
        capacityExceededBy: 20,
      },
    });
  });

  it("returns info when no stocking result is available", async () => {
    for (const analysis of [null, undefined]) {
      const issues = await stockingValidator.validate(context(analysis));

      expect(issues[0]).toMatchObject({
        code: AQUARIUM_VALIDATION_CODES.stockingAnalysisUnavailable,
        severity: "info",
      });
    }
  });

  it("returns one consolidated info finding for incomplete analysis", async () => {
    const analysis = analyzeStocking({
      ...stockingInput(1),
      livestock: [
        {
          speciesId: "unknown",
          speciesName: "Unknown",
          quantity: 3,
          bioloadScore: null,
        },
      ],
    });
    const issues = await stockingValidator.validate(context(analysis));

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      code: AQUARIUM_VALIDATION_CODES.stockingAnalysisUnavailable,
      severity: "info",
      metadata: {
        analysisComplete: false,
        uncalculatedLivestockCount: 3,
        warningCodes: ["MISSING_STOCKING_PROFILE"],
      },
    });
  });

  it("preserves a known overstocking error when analysis is partial", async () => {
    const analysis = analyzeStocking({
      ...stockingInput(12),
      livestock: [
        ...stockingInput(12).livestock,
        {
          speciesId: "unknown",
          speciesName: "Unknown",
          quantity: 1,
          bioloadScore: null,
        },
      ],
    });
    const issues = await stockingValidator.validate(context(analysis));

    expect(issues.map((issue) => issue.code)).toContain(
      AQUARIUM_VALIDATION_CODES.stockingAnalysisUnavailable,
    );
    expect(issues.map((issue) => issue.code)).toContain(
      AQUARIUM_VALIDATION_CODES.stockingOverCapacity,
    );
  });

  it("uses the existing stocking adapter and engine during orchestration", async () => {
    const species = {
      id: "species-a",
      slug: "species-a",
      common_name: "Species A",
      bioload_rating: 10,
    } as AquariumSpecies;
    const resolved: AquariumResolvedLivestockEntry = {
      speciesSlug: species.slug,
      quantity: 8,
      species,
    };
    const report = await validateAquarium(
      {
        ...build,
        livestock: [{ speciesSlug: species.slug, quantity: 8 }],
      },
      {
        context: { species: [resolved] },
        validators: [stockingValidator],
      },
    );

    expect(report.issues[0]).toMatchObject({
      code: AQUARIUM_VALIDATION_CODES.stockingFull,
      severity: "warning",
    });
  });
});

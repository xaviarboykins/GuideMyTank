import { describe, expect, it } from "vitest";

import { analyzeStocking } from "./engine";
import type {
  StockingAnalysisInput,
  StockingAnalysisLivestock,
  StockingAnalysisWarningCode,
} from "./types";

const livestock = (
  bioloadScore: number | null,
  quantity = 1,
  speciesId = "species-1",
): StockingAnalysisLivestock => ({
  speciesId,
  speciesName: `Species ${speciesId}`,
  quantity,
  bioloadScore,
});

function input(
  overrides: Partial<StockingAnalysisInput> = {},
): StockingAnalysisInput {
  return {
    tankGallons: 100,
    filtrationLevel: "standard",
    plantedLevel: "none",
    livestock: [],
    ...overrides,
  };
}

function warningCodes(result: ReturnType<typeof analyzeStocking>) {
  return result.warnings.map((warning) => warning.code);
}

function livestockForPercentage(percentage: number) {
  const targetBioload = percentage * 100;
  const quantityAtMaximumScore = Math.floor(targetBioload / 10);
  const remainder = targetBioload - quantityAtMaximumScore * 10;
  const entries = [livestock(10, quantityAtMaximumScore, "threshold-main")];

  if (remainder >= 1) {
    entries.push(livestock(remainder, 1, "threshold-remainder"));
  }

  return entries;
}

function expectWarning(
  result: ReturnType<typeof analyzeStocking>,
  code: StockingAnalysisWarningCode,
) {
  expect(warningCodes(result)).toContain(code);
}

describe("analyzeStocking", () => {
  describe("tank and empty-state safety", () => {
    it("marks an absent tank as incomplete", () => {
      const result = analyzeStocking(
        input({ tankGallons: undefined as never }),
      );

      expect(result.analysisComplete).toBe(false);
      expect(result.baseCapacity).toBe(0);
      expectWarning(result, "TANK_REQUIRED");
    });

    it.each([0, -10, Number.NaN, Number.POSITIVE_INFINITY])(
      "rejects invalid tank capacity %s",
      (tankGallons) => {
        const result = analyzeStocking(input({ tankGallons }));

        expect(result.analysisComplete).toBe(false);
        expect(result.baseCapacity).toBe(0);
        expectWarning(result, "INVALID_TANK_CAPACITY");
      },
    );

    it("returns a complete zero-utilization result for a tank without livestock", () => {
      const result = analyzeStocking(input());

      expect(result.analysisComplete).toBe(true);
      expect(result.totalBioload).toBe(0);
      expect(result.stockingPercentage).toBe(0);
      expect(result.remainingCapacity).toBe(100);
      expect(result.estimatedLivestockRemaining).toBeNull();
      expect(result.warnings).toEqual([]);
    });
  });

  describe("status thresholds", () => {
    it.each([
      [20, "lightly-stocked"],
      [39.99, "lightly-stocked"],
      [40, "moderately-stocked"],
      [55, "moderately-stocked"],
      [69.99, "moderately-stocked"],
      [70, "fully-stocked"],
      [85, "fully-stocked"],
      [100, "fully-stocked"],
      [100.01, "overstocked"],
      [120, "overstocked"],
    ] as const)("maps %s%% to %s", (percentage, status) => {
      const result = analyzeStocking(
        input({
          tankGallons: 10_000,
          livestock: livestockForPercentage(percentage),
        }),
      );

      expect(result.stockingPercentage).toBeCloseTo(percentage);
      expect(result.stockingStatus).toBe(status);
    });
  });

  describe("capacity calculations", () => {
    it("calculates remaining capacity", () => {
      const result = analyzeStocking(
        input({ tankGallons: 20, livestock: [livestock(3, 4)] }),
      );

      expect(result.totalBioload).toBe(12);
      expect(result.usedCapacity).toBe(12);
      expect(result.remainingCapacity).toBe(8);
      expect(result.capacityExceededBy).toBe(0);
    });

    it("calculates exceeded capacity and emits a critical warning", () => {
      const result = analyzeStocking(
        input({ tankGallons: 10, livestock: [livestock(4, 4)] }),
      );

      expect(result.remainingCapacity).toBe(0);
      expect(result.capacityExceededBy).toBe(6);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({ code: "OVERSTOCKED", severity: "critical" }),
      );
    });

    it("accounts for multiple species and quantities", () => {
      const result = analyzeStocking(
        input({
          livestock: [livestock(2, 3, "a"), livestock(5, 2, "b")],
        }),
      );

      expect(result.totalLivestockQuantity).toBe(5);
      expect(result.totalBioload).toBe(16);
      expect(result.stockingPercentage).toBe(16);
    });

    it("calculates average bioload and estimated similar livestock remaining", () => {
      const result = analyzeStocking(
        input({
          tankGallons: 20,
          livestock: [livestock(2, 2, "a"), livestock(4, 1, "b")],
        }),
      );

      expect(result.averageBioloadPerAnimal).toBeCloseTo(8 / 3);
      expect(result.remainingCapacity).toBe(12);
      expect(result.estimatedLivestockRemaining).toBe(4);
    });

    it("never returns negative remaining capacity", () => {
      const result = analyzeStocking(
        input({ tankGallons: 1, livestock: [livestock(10, 100)] }),
      );

      expect(result.remainingCapacity).toBe(0);
      expect(result.remainingCapacity).toBeGreaterThanOrEqual(0);
    });
  });

  describe("capacity adjustments", () => {
    it.each([
      ["low", 0.85],
      ["standard", 1],
      ["high", 1.1],
    ] as const)("applies %s filtration", (filtrationLevel, multiplier) => {
      const result = analyzeStocking(input({ filtrationLevel }));

      expect(result.filtrationMultiplier).toBe(multiplier);
      expect(result.effectiveCapacity).toBeCloseTo(100 * multiplier);
    });

    it.each([
      ["none", 1],
      ["light", 1.03],
      ["moderate", 1.07],
      ["heavy", 1.1],
    ] as const)("applies %s planting", (plantedLevel, multiplier) => {
      const result = analyzeStocking(input({ plantedLevel }));

      expect(result.plantedMultiplier).toBe(multiplier);
      expect(result.effectiveCapacity).toBeCloseTo(100 * multiplier);
    });

    it("combines modest filtration and planted adjustments", () => {
      const result = analyzeStocking(
        input({ filtrationLevel: "high", plantedLevel: "heavy" }),
      );

      expect(result.effectiveCapacity).toBeCloseTo(121);
    });

    it("uses warned conservative defaults for unknown adjustment values", () => {
      const result = analyzeStocking(
        input({
          filtrationLevel: "extreme" as never,
          plantedLevel: "jungle" as never,
        }),
      );

      expect(result.effectiveCapacity).toBe(100);
      expect(result.analysisComplete).toBe(false);
      expectWarning(result, "UNKNOWN_FILTRATION_LEVEL");
      expectWarning(result, "UNKNOWN_PLANTED_LEVEL");
    });
  });

  describe("uncalculated livestock and warnings", () => {
    it("does not silently count a missing profile as zero bioload", () => {
      const result = analyzeStocking(
        input({ livestock: [livestock(null, 3)] }),
      );

      expect(result.analysisComplete).toBe(false);
      expect(result.totalBioload).toBe(0);
      expect(result.uncalculatedLivestockCount).toBe(3);
      expect(result.averageBioloadPerAnimal).toBeNull();
      expectWarning(result, "MISSING_STOCKING_PROFILE");
    });

    it.each([0, -1, 11, Number.NaN, Number.POSITIVE_INFINITY])(
      "excludes invalid bioload score %s",
      (bioloadScore) => {
        const result = analyzeStocking(
          input({ livestock: [livestock(bioloadScore, 2)] }),
        );

        expect(result.analysisComplete).toBe(false);
        expect(result.totalBioload).toBe(0);
        expect(result.uncalculatedLivestockCount).toBe(2);
        expectWarning(result, "INVALID_BIOLOAD_SCORE");
      },
    );

    it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
      "excludes invalid quantity %s",
      (quantity) => {
        const result = analyzeStocking(
          input({ livestock: [livestock(3, quantity)] }),
        );

        expect(result.analysisComplete).toBe(false);
        expect(result.totalLivestockQuantity).toBe(0);
        expect(result.totalBioload).toBe(0);
        expect(result.uncalculatedLivestockCount).toBe(1);
        expectWarning(result, "INVALID_LIVESTOCK_QUANTITY");
      },
    );

    it("calculates valid livestock while marking mixed data incomplete", () => {
      const result = analyzeStocking(
        input({
          livestock: [
            livestock(2, 2, "valid"),
            livestock(null, 3, "missing"),
            livestock(-1, 4, "invalid"),
          ],
        }),
      );

      expect(result.totalLivestockQuantity).toBe(9);
      expect(result.totalBioload).toBe(4);
      expect(result.averageBioloadPerAnimal).toBe(2);
      expect(result.uncalculatedLivestockCount).toBe(7);
      expect(result.analysisComplete).toBe(false);
      expect(result.warnings).toHaveLength(2);
    });

    it("aggregates duplicate warning categories", () => {
      const result = analyzeStocking(
        input({
          livestock: [
            livestock(null, 2, "a"),
            livestock(null, 3, "b"),
            livestock(-1, 1, "c"),
            livestock(Number.NaN, 2, "d"),
          ],
        }),
      );

      expect(
        result.warnings.filter(
          (warning) => warning.code === "MISSING_STOCKING_PROFILE",
        ),
      ).toHaveLength(1);
      expect(
        result.warnings.filter(
          (warning) => warning.code === "INVALID_BIOLOAD_SCORE",
        ),
      ).toHaveLength(1);
    });
  });
});

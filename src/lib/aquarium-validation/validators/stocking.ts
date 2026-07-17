import { AQUARIUM_VALIDATION_CODES } from "../constants";
import { createValidationIssue } from "../issues";
import type {
  AquariumValidationIssue,
  AquariumValidator,
} from "../types";

export const stockingValidator: AquariumValidator = {
  name: "stocking",

  async validate(context): Promise<AquariumValidationIssue[]> {
    const analysis = context.stockingAnalysis;

    if (!analysis) {
      return [
        createValidationIssue({
          code: AQUARIUM_VALIDATION_CODES.stockingAnalysisUnavailable,
          category: "stocking",
          severity: "info",
          title: "Stocking analysis is unavailable",
          message:
            "GuideMyTank could not calculate stocking utilization for this build.",
          recommendation:
            "Select a tank and livestock with available stocking data before relying on capacity guidance.",
          affectedSpeciesIds: [],
        }),
      ];
    }

    const issues: AquariumValidationIssue[] = [];
    const affectedSpeciesIds = Array.from(
      new Set(context.species.map((entry) => entry.species.id)),
    );
    const analysisMetadata = {
      stockingStatus: analysis.stockingStatus,
      stockingPercentage: analysis.stockingPercentage,
      totalBioload: analysis.totalBioload,
      effectiveCapacity: analysis.effectiveCapacity,
      remainingCapacity: analysis.remainingCapacity,
      capacityExceededBy: analysis.capacityExceededBy,
      analysisComplete: analysis.analysisComplete,
      uncalculatedLivestockCount: analysis.uncalculatedLivestockCount,
    };

    if (!analysis.analysisComplete) {
      issues.push(
        createValidationIssue({
          code: AQUARIUM_VALIDATION_CODES.stockingAnalysisUnavailable,
          category: "stocking",
          severity: "info",
          title: "Stocking analysis is incomplete",
          message:
            "Some tank or livestock data could not be included in the stocking estimate.",
          recommendation:
            "Resolve the stocking-analysis warnings before relying on the utilization result.",
          affectedSpeciesIds,
          metadata: {
            ...analysisMetadata,
            warningCodes: analysis.warnings.map((warning) => warning.code),
          },
        }),
      );
    }

    if (analysis.stockingStatus === "fully-stocked") {
      issues.push(
        createValidationIssue({
          code: AQUARIUM_VALIDATION_CODES.stockingFull,
          category: "stocking",
          severity: "warning",
          title: "Aquarium is fully stocked",
          message: `Estimated stocking utilization is ${Math.round(analysis.stockingPercentage)}%.`,
          recommendation:
            "Avoid adding more livestock without reducing bioload or increasing effective capacity.",
          affectedSpeciesIds,
          metadata: analysisMetadata,
        }),
      );
    } else if (analysis.stockingStatus === "overstocked") {
      issues.push(
        createValidationIssue({
          code: AQUARIUM_VALIDATION_CODES.stockingOverCapacity,
          category: "stocking",
          severity: "error",
          title: "Aquarium is overstocked",
          message: `Estimated stocking utilization is ${Math.round(analysis.stockingPercentage)}%, exceeding effective capacity by ${analysis.capacityExceededBy} units.`,
          recommendation:
            "Reduce livestock bioload or choose a larger appropriately filtered aquarium.",
          affectedSpeciesIds,
          metadata: analysisMetadata,
        }),
      );
    }

    return issues;
  },
};

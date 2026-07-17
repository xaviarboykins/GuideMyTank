import { AQUARIUM_VALIDATION_CODES } from "../constants";
import { createValidationIssue } from "../issues";
import type {
  AquariumValidationIssue,
  AquariumValidator,
} from "../types";

export const compatibilityValidator: AquariumValidator = {
  name: "compatibility",

  async validate(context): Promise<AquariumValidationIssue[]> {
    const speciesById = new Map(
      context.species.map((entry) => [entry.species.id, entry.species]),
    );
    const issues: AquariumValidationIssue[] = [];

    for (const compatibilityResult of context.compatibilityResults) {
      const speciesA = speciesById.get(compatibilityResult.speciesAId);
      const speciesB = speciesById.get(compatibilityResult.speciesBId);
      const result = compatibilityResult.result;
      const affectedSpeciesIds = [
        compatibilityResult.speciesAId,
        compatibilityResult.speciesBId,
      ];
      const pairLabel = `${speciesA?.common_name ?? "Selected species"} and ${speciesB?.common_name ?? "selected species"}`;

      if (result?.compatibility === "compatible") {
        continue;
      }

      if (result?.compatibility === "caution") {
        issues.push(
          createValidationIssue({
            code: AQUARIUM_VALIDATION_CODES.compatibilityCaution,
            category: "compatibility",
            severity: "warning",
            title: `${pairLabel} require caution`,
            message:
              result.notes ??
              `${pairLabel} may work together only with careful planning.`,
            recommendation:
              "Review the compatibility reasons and provide enough space, cover, and monitoring.",
            affectedSpeciesIds,
            metadata: {
              score: result.score,
              status: result.status,
              confidence: result.confidence,
              expertValidated: result.expertValidated,
            },
          }),
        );
        continue;
      }

      if (result?.compatibility === "incompatible") {
        issues.push(
          createValidationIssue({
            code: AQUARIUM_VALIDATION_CODES.compatibilityIncompatible,
            category: "compatibility",
            severity: "error",
            title: `${pairLabel} are incompatible`,
            message:
              result.notes ??
              `${pairLabel} should not be kept together in this aquarium.`,
            recommendation:
              "Remove one of these species or plan separate aquariums.",
            affectedSpeciesIds,
            metadata: {
              score: result.score,
              status: result.status,
              confidence: result.confidence,
              expertValidated: result.expertValidated,
            },
          }),
        );
        continue;
      }

      issues.push(
        createValidationIssue({
          code: AQUARIUM_VALIDATION_CODES.compatibilityUnknown,
          category: "compatibility",
          severity: "info",
          title: `Compatibility is unknown for ${pairLabel}`,
          message: `GuideMyTank could not determine compatibility for ${pairLabel}.`,
          recommendation:
            "Research this pairing before adding both species to the same aquarium.",
          affectedSpeciesIds,
        }),
      );
    }

    return issues;
  },
};

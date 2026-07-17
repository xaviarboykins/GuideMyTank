import { AQUARIUM_VALIDATION_CODES } from "../constants";
import { createValidationIssue } from "../issues";
import type {
  AquariumValidationIssue,
  AquariumValidator,
  AquariumValidatorContext,
} from "../types";

function getUniqueSpecies(context: AquariumValidatorContext) {
  return Array.from(
    new Map(
      context.species.map((entry) => [entry.species.id, entry.species]),
    ).values(),
  ).sort((speciesA, speciesB) => speciesA.id.localeCompare(speciesB.id));
}

export const tankSizeValidator: AquariumValidator = {
  name: "tank-size",

  async validate(context): Promise<AquariumValidationIssue[]> {
    const tankGallons = context.input.tank.sizeGallons;
    const species = getUniqueSpecies(context);

    if (!Number.isFinite(tankGallons) || tankGallons <= 0) {
      return [
        createValidationIssue({
          code: AQUARIUM_VALIDATION_CODES.tankNotSelected,
          category: "tank_size",
          severity: "info",
          title: "Select a tank",
          message:
            "Choose a tank with a known volume to check species minimum tank requirements.",
          recommendation:
            "Select a tank product with an exact gallon capacity before relying on tank-size validation.",
          affectedSpeciesIds: species.map((item) => item.id),
        }),
      ];
    }

    const issues: AquariumValidationIssue[] = [];

    for (const item of species) {
      const minimumTankGallons = item.tank_size_gal;

      if (
        minimumTankGallons == null ||
        !Number.isFinite(minimumTankGallons) ||
        minimumTankGallons <= 0
      ) {
        continue;
      }

      if (tankGallons < minimumTankGallons) {
        issues.push(
          createValidationIssue({
            code: AQUARIUM_VALIDATION_CODES.tankBelowSpeciesMinimum,
            category: "tank_size",
            severity: "error",
            title: `Tank is too small for ${item.common_name}`,
            message: `${item.common_name} requires a tank of at least ${minimumTankGallons} gallons; the selected tank is ${tankGallons} gallons.`,
            recommendation: `Choose a tank of at least ${minimumTankGallons} gallons or remove ${item.common_name} from this build.`,
            affectedSpeciesIds: [item.id],
            metadata: {
              selectedTankGallons: tankGallons,
              minimumTankGallons,
            },
          }),
        );
      } else if (tankGallons === minimumTankGallons) {
        issues.push(
          createValidationIssue({
            code: AQUARIUM_VALIDATION_CODES.tankAtMinimum,
            category: "tank_size",
            severity: "info",
            title: `${item.common_name} is at its minimum tank size`,
            message: `The selected ${tankGallons}-gallon tank exactly meets the documented minimum for ${item.common_name}.`,
            recommendation:
              "A larger tank may provide more margin for territory, swimming space, and maintenance stability.",
            affectedSpeciesIds: [item.id],
            metadata: {
              selectedTankGallons: tankGallons,
              minimumTankGallons,
            },
          }),
        );
      }
    }

    return issues;
  },
};

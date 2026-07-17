import type { AquariumSpecies } from "@/lib/aquarium-builder/types";

import { AQUARIUM_VALIDATION_CODES } from "../constants";
import { createValidationIssue } from "../issues";
import { analyzeSharedRange, toNumericRange } from "../ranges";
import type {
  AquariumValidationIssue,
  AquariumValidator,
  AquariumValidatorContext,
} from "../types";

export type HeaterRequirement =
  | "required"
  | "recommended"
  | "optional"
  | "not-normally-required"
  | "temperature-conflict"
  | "insufficient-data";

export const HEATER_REQUIREMENT_THRESHOLDS_F = {
  recommendedMinimum: 68,
  requiredMinimum: 72,
} as const;

function getUniqueSpecies(context: AquariumValidatorContext) {
  return Array.from(
    new Map(
      context.species.map((entry) => [entry.species.id, entry.species]),
    ).values(),
  ).sort((speciesA, speciesB) => speciesA.id.localeCompare(speciesB.id));
}

export function analyzeHeaterRequirement(
  species: readonly AquariumSpecies[],
) {
  const range = analyzeSharedRange(species, (item) =>
    toNumericRange(
      item.recommended_min_temp_f ?? item.min_temp_f,
      item.recommended_max_temp_f ?? item.max_temp_f,
    ),
  );
  let requirement: HeaterRequirement;

  if (species.length === 0 || range.missingItems.length > 0) {
    requirement = "insufficient-data";
  } else if (!range.hasOverlap) {
    requirement = "temperature-conflict";
  } else {
    const sharedMinimum = range.sharedMinimum as number;
    const sharedMaximum = range.sharedMaximum as number;

    if (sharedMinimum >= HEATER_REQUIREMENT_THRESHOLDS_F.requiredMinimum) {
      requirement = "required";
    } else if (
      sharedMinimum >= HEATER_REQUIREMENT_THRESHOLDS_F.recommendedMinimum &&
      sharedMaximum > HEATER_REQUIREMENT_THRESHOLDS_F.requiredMinimum
    ) {
      requirement = "recommended";
    } else if (sharedMaximum <= HEATER_REQUIREMENT_THRESHOLDS_F.requiredMinimum) {
      requirement = "not-normally-required";
    } else {
      requirement = "optional";
    }
  }

  return { requirement, range };
}

export const heatingValidator: AquariumValidator = {
  name: "heating",

  async validate(context): Promise<AquariumValidationIssue[]> {
    const species = getUniqueSpecies(context);
    const analysis = analyzeHeaterRequirement(species);
    const affectedSpeciesIds = species.map((item) => item.id);
    const heaterEntries = context.input.equipment.filter(
      (item) => item.category === "heater",
    );
    const heaterQuantity = heaterEntries.reduce(
      (total, item) => total + item.quantity,
      0,
    );
    const heaterSelected = heaterEntries.length > 0;
    const issues: AquariumValidationIssue[] = [];
    const rangeMetadata = {
      requirement: analysis.requirement,
      sharedMinimumTemperatureF: analysis.range.sharedMinimum,
      sharedMaximumTemperatureF: analysis.range.sharedMaximum,
      missingSpeciesIds: analysis.range.missingItems.map((item) => item.id),
    };

    if (species.length > 0 && analysis.requirement === "insufficient-data") {
      issues.push(
        createValidationIssue({
          code: AQUARIUM_VALIDATION_CODES.heatingRequirementUnavailable,
          category: "heating",
          severity: "info",
          title: "Heating requirement cannot be confirmed",
          message:
            "Recommended temperature data is incomplete for some selected livestock.",
          recommendation:
            "Confirm the missing species temperature requirements before relying on heater guidance.",
          affectedSpeciesIds,
          metadata: rangeMetadata,
        }),
      );
    }

    if (analysis.requirement === "temperature-conflict") {
      issues.push(
        createValidationIssue({
          code: AQUARIUM_VALIDATION_CODES.heatingTemperatureConflict,
          category: "heating",
          severity: "error",
          title: "Recommended temperatures do not overlap",
          message:
            "The selected livestock have no shared recommended temperature range.",
          recommendation:
            "Remove a conflicting species or choose livestock with overlapping recommended temperatures.",
          affectedSpeciesIds,
          metadata: rangeMetadata,
        }),
      );
    } else if (analysis.requirement === "required" && !heaterSelected) {
      issues.push(
        createValidationIssue({
          code: AQUARIUM_VALIDATION_CODES.heaterRequiredMissing,
          category: "heating",
          severity: "error",
          title: "Required heater is missing",
          message: `The shared recommended livestock range begins at ${analysis.range.sharedMinimum}°F, so regulated heating is required by the approved GuideMyTank threshold.`,
          recommendation:
            "Select one heater whose documented tank range supports this aquarium.",
          affectedSpeciesIds,
          metadata: rangeMetadata,
        }),
      );
    } else if (analysis.requirement === "recommended" && !heaterSelected) {
      issues.push(
        createValidationIssue({
          code: AQUARIUM_VALIDATION_CODES.heaterRecommendedMissing,
          category: "heating",
          severity: "warning",
          title: "A heater is recommended",
          message: `The shared recommended livestock range is ${analysis.range.sharedMinimum}°F to ${analysis.range.sharedMaximum}°F and extends into warmer water.`,
          recommendation:
            "Consider one heater whose documented tank range supports this aquarium.",
          affectedSpeciesIds,
          metadata: rangeMetadata,
        }),
      );
    }

    if (!heaterSelected) {
      return issues;
    }

    if (
      heaterEntries.length > 1 ||
      heaterQuantity !== 1 ||
      heaterEntries.some((item) => item.quantity !== 1)
    ) {
      issues.push(
        createValidationIssue({
          code: AQUARIUM_VALIDATION_CODES.multipleHeatersUnsupported,
          category: "heating",
          severity: "error",
          title: "Only one heater is supported",
          message:
            "This Builder supports exactly one selected heater with a quantity of one.",
          recommendation:
            "Remove additional heaters or reduce the selected heater quantity to one.",
          affectedSpeciesIds,
          metadata: { heaterEntryCount: heaterEntries.length, heaterQuantity },
        }),
      );
    }

    if (analysis.requirement === "not-normally-required") {
      issues.push(
        createValidationIssue({
          code: AQUARIUM_VALIDATION_CODES.heaterMayBeUnnecessary,
          category: "heating",
          severity: "info",
          title: "A heater may not normally be required",
          message: `The shared recommended livestock range ends at ${analysis.range.sharedMaximum}°F.`,
          recommendation:
            "Confirm the aquarium environment before using heating for this livestock selection.",
          affectedSpeciesIds,
          metadata: rangeMetadata,
        }),
      );
    }

    const heaterProduct = context.heaterProduct;

    if (!heaterProduct || heaterProduct.category !== "heaters") {
      issues.push(
        createValidationIssue({
          code: AQUARIUM_VALIDATION_CODES.heaterSpecificationMissing,
          category: "heating",
          severity: "warning",
          title: "Heater specifications are unavailable",
          message:
            "The selected heater could not be matched to current structured catalog specifications.",
          recommendation:
            "Select an active catalog heater with a documented supported tank range.",
          affectedSpeciesIds,
        }),
      );

      return issues;
    }

    if (!heaterProduct.is_active) {
      issues.push(
        createValidationIssue({
          code: AQUARIUM_VALIDATION_CODES.heaterInactive,
          category: "heating",
          severity: "warning",
          title: "Selected heater is inactive",
          message: `${heaterProduct.title} is no longer active in the GuideMyTank catalog.`,
          recommendation: "Choose an active heater before finalizing this build.",
          affectedSpeciesIds,
          metadata: { heaterProductId: heaterProduct.id },
        }),
      );
    }

    const minimumGallons = heaterProduct.recommended_tank_min_gallons;
    const maximumGallons = heaterProduct.recommended_tank_max_gallons;

    if (minimumGallons == null || maximumGallons == null) {
      issues.push(
        createValidationIssue({
          code: AQUARIUM_VALIDATION_CODES.heaterSpecificationMissing,
          category: "heating",
          severity: "warning",
          title: "Heater tank range is incomplete",
          message:
            "Tank-size compatibility cannot be confirmed from the available heater specifications.",
          recommendation:
            "Verify the manufacturer-supported tank range before relying on this heater.",
          affectedSpeciesIds,
          metadata: { heaterProductId: heaterProduct.id },
        }),
      );
    } else if (
      Number.isFinite(context.input.tank.sizeGallons) &&
      context.input.tank.sizeGallons > 0
    ) {
      const tankGallons = context.input.tank.sizeGallons;

      if (tankGallons > maximumGallons) {
        issues.push(
          createValidationIssue({
            code: AQUARIUM_VALIDATION_CODES.heaterUndersized,
            category: "heating",
            severity: "error",
            title: "Heater is undersized for the selected tank",
            message: `${heaterProduct.title} supports tanks up to ${maximumGallons} gallons; the selected tank is ${tankGallons} gallons.`,
            recommendation:
              "Choose one heater whose documented maximum tank size covers the selected aquarium.",
            affectedSpeciesIds,
            metadata: { tankGallons, minimumGallons, maximumGallons },
          }),
        );
      } else if (tankGallons < minimumGallons) {
        issues.push(
          createValidationIssue({
            code: AQUARIUM_VALIDATION_CODES.heaterOutsideSupportedRange,
            category: "heating",
            severity: "warning",
            title: "Heater is outside its supported tank range",
            message: `${heaterProduct.title} is documented for tanks starting at ${minimumGallons} gallons; the selected tank is ${tankGallons} gallons.`,
            recommendation:
              "Choose a heater whose documented tank range includes the selected aquarium.",
            affectedSpeciesIds,
            metadata: { tankGallons, minimumGallons, maximumGallons },
          }),
        );
      }
    }

    return issues;
  },
};

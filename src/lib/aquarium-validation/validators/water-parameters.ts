import type { AquariumSpecies } from "@/lib/aquarium-builder/types";

import { AQUARIUM_VALIDATION_CODES } from "../constants";
import { createValidationIssue } from "../issues";
import type {
  AquariumValidationIssue,
  AquariumValidator,
  AquariumValidatorContext,
} from "../types";

export const WATER_PARAMETER_NARROW_OVERLAP_THRESHOLDS = {
  temperatureFahrenheit: 4,
  ph: 0.5,
} as const;

interface SupportedRange {
  minimum: number;
  maximum: number;
}

interface RangeEntry {
  species: AquariumSpecies;
  range: SupportedRange;
}

interface ParameterConfiguration {
  key: "temperature" | "ph" | "gh" | "kh";
  label: string;
  unit: string;
  noOverlapCode: string;
  narrowOverlapCode?: string;
  narrowThreshold?: number;
  getRange(species: AquariumSpecies): SupportedRange | null;
}

function toRange(
  minimum: number | null,
  maximum: number | null,
): SupportedRange | null {
  if (
    minimum == null ||
    maximum == null ||
    !Number.isFinite(minimum) ||
    !Number.isFinite(maximum) ||
    minimum > maximum
  ) {
    return null;
  }

  return { minimum, maximum };
}

const parameterConfigurations: readonly ParameterConfiguration[] = [
  {
    key: "temperature",
    label: "temperature",
    unit: "°F",
    noOverlapCode: AQUARIUM_VALIDATION_CODES.waterTemperatureNoOverlap,
    narrowOverlapCode:
      AQUARIUM_VALIDATION_CODES.waterTemperatureNarrowOverlap,
    narrowThreshold:
      WATER_PARAMETER_NARROW_OVERLAP_THRESHOLDS.temperatureFahrenheit,
    getRange: (species) =>
      toRange(species.min_temp_f, species.max_temp_f),
  },
  {
    key: "ph",
    label: "pH",
    unit: " pH",
    noOverlapCode: AQUARIUM_VALIDATION_CODES.waterPhNoOverlap,
    narrowOverlapCode: AQUARIUM_VALIDATION_CODES.waterPhNarrowOverlap,
    narrowThreshold: WATER_PARAMETER_NARROW_OVERLAP_THRESHOLDS.ph,
    getRange: (species) => toRange(species.min_ph, species.max_ph),
  },
  {
    key: "gh",
    label: "GH",
    unit: " dGH",
    noOverlapCode: AQUARIUM_VALIDATION_CODES.waterGhNoOverlap,
    getRange: (species) =>
      toRange(species.min_gh_dgh, species.max_gh_dgh),
  },
  {
    key: "kh",
    label: "KH",
    unit: " dKH",
    noOverlapCode: AQUARIUM_VALIDATION_CODES.waterKhNoOverlap,
    getRange: (species) =>
      toRange(species.min_kh_dkh, species.max_kh_dkh),
  },
];

function getUniqueSpecies(context: AquariumValidatorContext) {
  return Array.from(
    new Map(
      context.species.map((entry) => [entry.species.id, entry.species]),
    ).values(),
  ).sort((speciesA, speciesB) => speciesA.id.localeCompare(speciesB.id));
}

function evaluateParameter(
  species: AquariumSpecies[],
  configuration: ParameterConfiguration,
) {
  const completeEntries: RangeEntry[] = species.flatMap((item) => {
    const range = configuration.getRange(item);
    return range ? [{ species: item, range }] : [];
  });
  const missingSpeciesIds = species
    .filter((item) => configuration.getRange(item) == null)
    .map((item) => item.id);
  const issues: AquariumValidationIssue[] = [];

  if (completeEntries.length < 2) {
    return { issues, missingSpeciesIds };
  }

  const sharedMinimum = Math.max(
    ...completeEntries.map((entry) => entry.range.minimum),
  );
  const sharedMaximum = Math.min(
    ...completeEntries.map((entry) => entry.range.maximum),
  );
  const affectedSpeciesIds = completeEntries.map((entry) => entry.species.id);
  const metadata = {
    parameter: configuration.key,
    sharedMinimum,
    sharedMaximum,
    completeSpeciesCount: completeEntries.length,
    selectedSpeciesCount: species.length,
  };

  if (sharedMinimum > sharedMaximum) {
    issues.push(
      createValidationIssue({
        code: configuration.noOverlapCode,
        category: "water_parameters",
        severity: "error",
        title: `No shared ${configuration.label} range`,
        message: `The selected species do not have an overlapping ${configuration.label} range.`,
        recommendation:
          "Remove a conflicting species or choose livestock with overlapping water requirements.",
        affectedSpeciesIds,
        metadata,
      }),
    );

    return { issues, missingSpeciesIds };
  }

  const overlapWidth = sharedMaximum - sharedMinimum;

  if (
    configuration.narrowOverlapCode &&
    configuration.narrowThreshold != null &&
    overlapWidth <= configuration.narrowThreshold
  ) {
    issues.push(
      createValidationIssue({
        code: configuration.narrowOverlapCode,
        category: "water_parameters",
        severity: "warning",
        title: `Shared ${configuration.label} range is narrow`,
        message: `The shared ${configuration.label} range is ${sharedMinimum}${configuration.unit} to ${sharedMaximum}${configuration.unit}.`,
        recommendation:
          "Monitor this parameter closely and maintain it within the shared range.",
        affectedSpeciesIds,
        metadata: {
          ...metadata,
          overlapWidth,
          narrowThreshold: configuration.narrowThreshold,
        },
      }),
    );
  }

  return { issues, missingSpeciesIds };
}

export const waterParameterValidator: AquariumValidator = {
  name: "water-parameters",

  async validate(context): Promise<AquariumValidationIssue[]> {
    const species = getUniqueSpecies(context);

    if (species.length < 2) {
      return [];
    }

    const issues: AquariumValidationIssue[] = [];
    const incompleteRequiredParameters: string[] = [];
    const incompleteSpeciesIds = new Set<string>();

    for (const configuration of parameterConfigurations) {
      const result = evaluateParameter(species, configuration);
      issues.push(...result.issues);

      if (
        (configuration.key === "temperature" || configuration.key === "ph") &&
        result.missingSpeciesIds.length > 0
      ) {
        incompleteRequiredParameters.push(configuration.key);
        result.missingSpeciesIds.forEach((speciesId) =>
          incompleteSpeciesIds.add(speciesId),
        );
      }
    }

    if (incompleteRequiredParameters.length > 0) {
      issues.push(
        createValidationIssue({
          code: AQUARIUM_VALIDATION_CODES.waterParameterDataIncomplete,
          category: "water_parameters",
          severity: "info",
          title: "Water-parameter data is incomplete",
          message:
            "Temperature or pH data is unavailable for some selected species, so the shared-range analysis is partial.",
          recommendation:
            "Treat available results as partial guidance until the missing species data is resolved.",
          affectedSpeciesIds: Array.from(incompleteSpeciesIds),
          metadata: {
            incompleteParameters: incompleteRequiredParameters.sort(),
          },
        }),
      );
    }

    return issues;
  },
};

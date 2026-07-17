import type {
  ValidationCategory,
  ValidationSeverity,
} from "./types";

export const VALIDATION_SEVERITY_ORDER: Record<ValidationSeverity, number> = {
  error: 0,
  warning: 1,
  info: 2,
};

export const VALIDATION_CATEGORIES: readonly ValidationCategory[] = [
  "compatibility",
  "predation",
  "territorial",
  "school_size",
  "water_parameters",
  "heating",
  "tank_size",
  "stocking",
];

export const AQUARIUM_VALIDATION_CODES = {
  compatibilityCaution: "COMPATIBILITY_CAUTION",
  compatibilityIncompatible: "COMPATIBILITY_INCOMPATIBLE",
  compatibilityUnknown: "COMPATIBILITY_UNKNOWN",
  predationHighRisk: "PREDATION_HIGH_RISK",
  predationPossible: "PREDATION_POSSIBLE",
  territorialSameSpeciesConflict: "TERRITORIAL_SAME_SPECIES_CONFLICT",
  territorialPairConflict: "TERRITORIAL_PAIR_CONFLICT",
  territorialSpaceWarning: "TERRITORIAL_SPACE_WARNING",
  schoolSizeBelowMinimum: "SCHOOL_SIZE_BELOW_MINIMUM",
  waterTemperatureNoOverlap: "WATER_TEMPERATURE_NO_OVERLAP",
  waterTemperatureNarrowOverlap: "WATER_TEMPERATURE_NARROW_OVERLAP",
  waterPhNoOverlap: "WATER_PH_NO_OVERLAP",
  waterPhNarrowOverlap: "WATER_PH_NARROW_OVERLAP",
  waterGhNoOverlap: "WATER_GH_NO_OVERLAP",
  waterKhNoOverlap: "WATER_KH_NO_OVERLAP",
  waterParameterDataIncomplete: "WATER_PARAMETER_DATA_INCOMPLETE",
  heatingRequirementUnavailable: "HEATING_REQUIREMENT_UNAVAILABLE",
  heatingTemperatureConflict: "HEATING_TEMPERATURE_CONFLICT",
  heaterRequiredMissing: "HEATER_REQUIRED_MISSING",
  heaterRecommendedMissing: "HEATER_RECOMMENDED_MISSING",
  heaterUndersized: "HEATER_UNDERSIZED",
  heaterOutsideSupportedRange: "HEATER_OUTSIDE_SUPPORTED_RANGE",
  heaterSpecificationMissing: "HEATER_SPECIFICATION_MISSING",
  heaterInactive: "HEATER_INACTIVE",
  heaterMayBeUnnecessary: "HEATER_MAY_BE_UNNECESSARY",
  multipleHeatersUnsupported: "MULTIPLE_HEATERS_UNSUPPORTED",
  tankNotSelected: "TANK_NOT_SELECTED",
  tankBelowSpeciesMinimum: "TANK_BELOW_SPECIES_MINIMUM",
  tankAtMinimum: "TANK_AT_MINIMUM",
  stockingLight: "STOCKING_LIGHT",
  stockingNearCapacity: "STOCKING_NEAR_CAPACITY",
  stockingFull: "STOCKING_FULL",
  stockingOverCapacity: "STOCKING_OVER_CAPACITY",
  stockingAnalysisUnavailable: "STOCKING_ANALYSIS_UNAVAILABLE",
} as const;

export type AquariumValidationCode =
  (typeof AQUARIUM_VALIDATION_CODES)[keyof typeof AQUARIUM_VALIDATION_CODES];

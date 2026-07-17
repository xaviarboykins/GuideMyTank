import type {
  AquariumFiltrationLevel,
  AquariumPlantedLevel,
} from "@/lib/aquarium-builder/types";

import {
  FILTRATION_CAPACITY_MULTIPLIERS,
  PLANTED_CAPACITY_MULTIPLIERS,
  STOCKING_STATUS_THRESHOLDS,
} from "./constants";
import type { StockingStatus } from "./types";

export function isFiltrationLevel(
  value: unknown,
): value is AquariumFiltrationLevel {
  return value === "low" || value === "standard" || value === "high";
}

export function isPlantedLevel(value: unknown): value is AquariumPlantedLevel {
  return (
    value === "none" ||
    value === "light" ||
    value === "moderate" ||
    value === "heavy"
  );
}

export function getFiltrationMultiplier(level: AquariumFiltrationLevel) {
  return FILTRATION_CAPACITY_MULTIPLIERS[level];
}

export function getPlantedMultiplier(level: AquariumPlantedLevel) {
  return PLANTED_CAPACITY_MULTIPLIERS[level];
}

export function getStockingStatus(percentage: number): StockingStatus {
  if (
    percentage >
    STOCKING_STATUS_THRESHOLDS.overstockedThresholdPercentage
  ) {
    return "overstocked";
  }

  if (
    percentage >=
    STOCKING_STATUS_THRESHOLDS.fullyStockedMinimumPercentage
  ) {
    return "fully-stocked";
  }

  if (
    percentage >=
    STOCKING_STATUS_THRESHOLDS.moderatelyStockedMinimumPercentage
  ) {
    return "moderately-stocked";
  }

  return "lightly-stocked";
}

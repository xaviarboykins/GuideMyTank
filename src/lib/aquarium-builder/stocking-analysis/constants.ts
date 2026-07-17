import type {
  AquariumFiltrationLevel,
  AquariumPlantedLevel,
} from "@/lib/aquarium-builder/types";

import type { StockingStatus } from "./types";

export const BIOLOAD_SCORE_RANGE = {
  minimum: 1,
  maximum: 10,
} as const;

export const STOCKING_STATUS_THRESHOLDS = {
  moderatelyStockedMinimumPercentage: 40,
  fullyStockedMinimumPercentage: 70,
  // Exactly 100% is fully stocked; only values above this are overstocked.
  overstockedThresholdPercentage: 100,
} as const;

export const FILTRATION_CAPACITY_MULTIPLIERS: Record<
  AquariumFiltrationLevel,
  number
> = {
  low: 0.85,
  standard: 1,
  high: 1.1,
};

export const PLANTED_CAPACITY_MULTIPLIERS: Record<
  AquariumPlantedLevel,
  number
> = {
  none: 1,
  light: 1.03,
  moderate: 1.07,
  heavy: 1.1,
};

export const STOCKING_STATUS_LABELS: Record<StockingStatus, string> = {
  "lightly-stocked": "Lightly Stocked",
  "moderately-stocked": "Moderately Stocked",
  "fully-stocked": "Fully Stocked",
  overstocked: "Overstocked",
};

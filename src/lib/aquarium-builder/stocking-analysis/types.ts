import type {
  AquariumFiltrationLevel,
  AquariumPlantedLevel,
} from "@/lib/aquarium-builder/types";

export type StockingStatus =
  | "lightly-stocked"
  | "moderately-stocked"
  | "fully-stocked"
  | "overstocked";

export type StockingAnalysisWarningSeverity =
  | "info"
  | "warning"
  | "critical";

export type StockingAnalysisWarningCode =
  | "TANK_REQUIRED"
  | "INVALID_TANK_CAPACITY"
  | "UNKNOWN_FILTRATION_LEVEL"
  | "UNKNOWN_PLANTED_LEVEL"
  | "MISSING_STOCKING_PROFILE"
  | "INVALID_BIOLOAD_SCORE"
  | "INVALID_LIVESTOCK_QUANTITY"
  | "OVERSTOCKED";

export interface StockingAnalysisWarning {
  code: StockingAnalysisWarningCode;
  severity: StockingAnalysisWarningSeverity;
  message: string;
}

/**
 * A normalized livestock entry for estimated capacity analysis.
 * `bioloadScore` is an estimate per animal, not a measurement in gallons.
 */
export interface StockingAnalysisLivestock {
  speciesId: string;
  speciesName: string;
  quantity: number;
  bioloadScore: number | null;
}

/**
 * Pure engine input. `tankGallons` must be an exact configured volume; callers
 * must not infer it from an ambiguous product range.
 */
export interface StockingAnalysisInput {
  tankGallons: number;
  filtrationLevel: AquariumFiltrationLevel;
  plantedLevel: AquariumPlantedLevel;
  livestock: StockingAnalysisLivestock[];
}

export interface StockingAnalysisResult {
  baseCapacity: number;
  effectiveCapacity: number;

  totalBioload: number;
  usedCapacity: number;
  remainingCapacity: number;
  capacityExceededBy: number;

  stockingPercentage: number;
  stockingStatus: StockingStatus;

  totalLivestockQuantity: number;
  averageBioloadPerAnimal: number | null;
  estimatedLivestockRemaining: number | null;

  filtrationMultiplier: number;
  plantedMultiplier: number;

  analysisComplete: boolean;
  uncalculatedLivestockCount: number;

  warnings: StockingAnalysisWarning[];
}

import {
  getFiltrationMultiplier,
  getPlantedMultiplier,
  getStockingStatus,
  isFiltrationLevel,
  isPlantedLevel,
} from "./helpers";
import { BIOLOAD_SCORE_RANGE } from "./constants";
import type {
  StockingAnalysisInput,
  StockingAnalysisLivestock,
  StockingAnalysisResult,
  StockingAnalysisWarning,
  StockingAnalysisWarningCode,
  StockingAnalysisWarningSeverity,
} from "./types";

const SAFE_FILTRATION_LEVEL = "standard";
const SAFE_PLANTED_LEVEL = "none";

function createWarning(
  code: StockingAnalysisWarningCode,
  severity: StockingAnalysisWarningSeverity,
  message: string,
): StockingAnalysisWarning {
  return { code, severity, message };
}

function isPositiveFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isValidBioloadScore(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= BIOLOAD_SCORE_RANGE.minimum &&
    value <= BIOLOAD_SCORE_RANGE.maximum
  );
}

/**
 * Estimates aquarium stocking utilization from normalized builder data.
 *
 * This function is pure. Capacity and bioload are comparative estimate units;
 * the result is not an exact safe-fish guarantee or a compatibility analysis.
 */
export function analyzeStocking(
  input: StockingAnalysisInput,
): StockingAnalysisResult {
  const warnings: StockingAnalysisWarning[] = [];
  const rawInput = input as StockingAnalysisInput | null | undefined;
  const rawTankGallons = rawInput?.tankGallons;
  let analysisComplete = true;

  let baseCapacity = 0;

  if (rawTankGallons == null) {
    analysisComplete = false;
    warnings.push(
      createWarning(
        "TANK_REQUIRED",
        "critical",
        "Select a tank with a known capacity before relying on this analysis.",
      ),
    );
  } else if (!isPositiveFiniteNumber(rawTankGallons)) {
    analysisComplete = false;
    warnings.push(
      createWarning(
        "INVALID_TANK_CAPACITY",
        "critical",
        "Tank capacity must be a finite number greater than zero gallons.",
      ),
    );
  } else {
    baseCapacity = rawTankGallons;
  }

  const rawFiltrationLevel = rawInput?.filtrationLevel as unknown;
  const filtrationLevel = isFiltrationLevel(rawFiltrationLevel)
    ? rawFiltrationLevel
    : SAFE_FILTRATION_LEVEL;

  if (!isFiltrationLevel(rawFiltrationLevel)) {
    analysisComplete = false;
    warnings.push(
      createWarning(
        "UNKNOWN_FILTRATION_LEVEL",
        "warning",
        "Filtration level was not recognized; standard filtration was used for the estimate.",
      ),
    );
  }

  const rawPlantedLevel = rawInput?.plantedLevel as unknown;
  const plantedLevel = isPlantedLevel(rawPlantedLevel)
    ? rawPlantedLevel
    : SAFE_PLANTED_LEVEL;

  if (!isPlantedLevel(rawPlantedLevel)) {
    analysisComplete = false;
    warnings.push(
      createWarning(
        "UNKNOWN_PLANTED_LEVEL",
        "warning",
        "Planted level was not recognized; no planted capacity adjustment was used.",
      ),
    );
  }

  const filtrationMultiplier = getFiltrationMultiplier(filtrationLevel);
  const plantedMultiplier = getPlantedMultiplier(plantedLevel);
  const effectiveCapacity =
    baseCapacity * filtrationMultiplier * plantedMultiplier;

  const livestock = Array.isArray(rawInput?.livestock)
    ? rawInput.livestock
    : [];
  let totalBioload = 0;
  let totalLivestockQuantity = 0;
  let calculatedLivestockQuantity = 0;
  let uncalculatedLivestockCount = 0;
  let invalidQuantityEntryCount = 0;
  let missingProfileLivestockCount = 0;
  let invalidBioloadLivestockCount = 0;

  for (const entry of livestock as StockingAnalysisLivestock[]) {
    const quantity = entry?.quantity;

    if (!Number.isInteger(quantity) || !isPositiveFiniteNumber(quantity)) {
      analysisComplete = false;
      uncalculatedLivestockCount += 1;
      invalidQuantityEntryCount += 1;
      continue;
    }

    totalLivestockQuantity += quantity;

    if (entry.bioloadScore == null) {
      analysisComplete = false;
      uncalculatedLivestockCount += quantity;
      missingProfileLivestockCount += quantity;
      continue;
    }

    if (!isValidBioloadScore(entry.bioloadScore)) {
      analysisComplete = false;
      uncalculatedLivestockCount += quantity;
      invalidBioloadLivestockCount += quantity;
      continue;
    }

    totalBioload += entry.bioloadScore * quantity;
    calculatedLivestockQuantity += quantity;
  }

  if (invalidQuantityEntryCount > 0) {
    warnings.push(
      createWarning(
        "INVALID_LIVESTOCK_QUANTITY",
        "warning",
        `${invalidQuantityEntryCount} livestock ${invalidQuantityEntryCount === 1 ? "entry has" : "entries have"} an invalid quantity and were excluded from the analysis.`,
      ),
    );
  }

  if (missingProfileLivestockCount > 0) {
    warnings.push(
      createWarning(
        "MISSING_STOCKING_PROFILE",
        "warning",
        `${missingProfileLivestockCount} selected ${missingProfileLivestockCount === 1 ? "animal is" : "animals are"} missing a bioload score, so this analysis is incomplete.`,
      ),
    );
  }

  if (invalidBioloadLivestockCount > 0) {
    warnings.push(
      createWarning(
        "INVALID_BIOLOAD_SCORE",
        "warning",
        `${invalidBioloadLivestockCount} selected ${invalidBioloadLivestockCount === 1 ? "animal has" : "animals have"} an invalid bioload score and could not be calculated.`,
      ),
    );
  }

  const usedCapacity = totalBioload;
  const remainingCapacity = Math.max(effectiveCapacity - usedCapacity, 0);
  const capacityExceededBy = Math.max(usedCapacity - effectiveCapacity, 0);
  const stockingPercentage =
    effectiveCapacity > 0 ? (usedCapacity / effectiveCapacity) * 100 : 0;
  const stockingStatus = getStockingStatus(stockingPercentage);
  const averageBioloadPerAnimal =
    calculatedLivestockQuantity > 0
      ? totalBioload / calculatedLivestockQuantity
      : null;
  const estimatedLivestockRemaining =
    averageBioloadPerAnimal != null && averageBioloadPerAnimal > 0
      ? Math.floor(remainingCapacity / averageBioloadPerAnimal)
      : null;

  if (stockingStatus === "overstocked") {
    warnings.push(
      createWarning(
        "OVERSTOCKED",
        "critical",
        `Estimated bioload exceeds effective capacity by ${capacityExceededBy} units.`,
      ),
    );
  }

  return {
    baseCapacity,
    effectiveCapacity,
    totalBioload,
    usedCapacity,
    remainingCapacity,
    capacityExceededBy,
    stockingPercentage,
    stockingStatus,
    totalLivestockQuantity,
    averageBioloadPerAnimal,
    estimatedLivestockRemaining,
    filtrationMultiplier,
    plantedMultiplier,
    analysisComplete,
    uncalculatedLivestockCount,
    warnings,
  };
}

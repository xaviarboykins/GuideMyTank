import type {
  AquariumBuild,
  AquariumFiltrationLevel,
  AquariumPlantedLevel,
  AquariumSpecies,
} from "@/lib/aquarium-builder/types";

import type { StockingAnalysisInput } from "./types";

export const FILTRATION_TURNOVER_THRESHOLDS = {
  standardMinimum: 5,
  highMinimum: 8,
} as const;

export const PLANTED_DENSITY_THRESHOLDS = {
  moderateMinimumPlantsPerGallon: 0.25,
  heavyMinimumPlantsPerGallon: 0.5,
} as const;

export function deriveAquariumFiltrationLevel(
  build: AquariumBuild,
): AquariumFiltrationLevel {
  const selectedFilter = build.equipment.find(
    (item) => item.category === "filter",
  );
  const tankGallons = build.tank.sizeGallons;
  const flowRateGph = selectedFilter?.flowRateGph;

  if (
    !Number.isFinite(tankGallons) ||
    tankGallons <= 0 ||
    !Number.isFinite(flowRateGph) ||
    flowRateGph == null ||
    flowRateGph <= 0
  ) {
    return "low";
  }

  const turnoverPerHour = flowRateGph / tankGallons;

  if (turnoverPerHour >= FILTRATION_TURNOVER_THRESHOLDS.highMinimum) {
    return "high";
  }

  if (turnoverPerHour >= FILTRATION_TURNOVER_THRESHOLDS.standardMinimum) {
    return "standard";
  }

  return "low";
}

export function deriveAquariumPlantedLevel(
  build: AquariumBuild,
): AquariumPlantedLevel {
  if (build.tank.plantedLevel !== "none") {
    return build.tank.plantedLevel;
  }

  const totalPlants = build.plants.reduce((total, entry) => {
    return Number.isFinite(entry.quantity) && entry.quantity > 0
      ? total + entry.quantity
      : total;
  }, 0);

  if (totalPlants === 0) {
    return "none";
  }

  if (!Number.isFinite(build.tank.sizeGallons) || build.tank.sizeGallons <= 0) {
    return "light";
  }

  const plantsPerGallon = totalPlants / build.tank.sizeGallons;

  if (
    plantsPerGallon >=
    PLANTED_DENSITY_THRESHOLDS.heavyMinimumPlantsPerGallon
  ) {
    return "heavy";
  }

  if (
    plantsPerGallon >=
    PLANTED_DENSITY_THRESHOLDS.moderateMinimumPlantsPerGallon
  ) {
    return "moderate";
  }

  return "light";
}

/**
 * Adapts builder state to the pure stocking engine without fetching data.
 * Missing species remain represented with a null score so analysis is visibly
 * incomplete instead of silently treating them as zero bioload.
 */
export function normalizeStockingAnalysisInput(
  build: AquariumBuild,
  species: AquariumSpecies[],
): StockingAnalysisInput {
  const speciesBySlug = new Map(species.map((item) => [item.slug, item]));

  return {
    tankGallons: build.tank.sizeGallons,
    filtrationLevel: deriveAquariumFiltrationLevel(build),
    plantedLevel: deriveAquariumPlantedLevel(build),
    livestock: build.livestock.map((entry) => {
      const item = speciesBySlug.get(entry.speciesSlug);

      return {
        speciesId: item?.id ?? `unresolved:${entry.speciesSlug}`,
        speciesName: item?.common_name ?? entry.speciesSlug,
        quantity: entry.quantity,
        bioloadScore: item?.bioload_rating ?? null,
      };
    }),
  };
}

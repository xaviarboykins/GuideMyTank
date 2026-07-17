import type { AquariumPlantEntry, AquariumPlantedLevel } from "./types";

export const PLANTED_DENSITY_THRESHOLDS = {
  moderateMinimumPlantsPerGallon: 0.25,
  heavyMinimumPlantsPerGallon: 0.5,
} as const;

export function calculatePlantQuantity(
  plants: AquariumPlantEntry[] | null | undefined,
) {
  if (!Array.isArray(plants)) {
    return 0;
  }

  return plants.reduce((total, entry) => {
    return Number.isInteger(entry?.quantity) && entry.quantity > 0
      ? total + entry.quantity
      : total;
  }, 0);
}

export function calculatePlantedLevel(
  plants: AquariumPlantEntry[] | null | undefined,
  tankGallons: number | null | undefined,
  storedLevel: AquariumPlantedLevel = "none",
): AquariumPlantedLevel {
  if (storedLevel !== "none") {
    return storedLevel;
  }

  const totalPlants = calculatePlantQuantity(plants);

  if (totalPlants === 0) {
    return "none";
  }

  if (!Number.isFinite(tankGallons) || tankGallons == null || tankGallons <= 0) {
    return "light";
  }

  const plantsPerGallon = totalPlants / tankGallons;

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

export function updateAquariumPlantEntry(
  plants: AquariumPlantEntry[],
  plantId: string,
  quantity: number,
): AquariumPlantEntry[] {
  const normalizedPlantId = plantId.trim();

  if (!normalizedPlantId) {
    return plants;
  }

  const numericQuantity = Number(quantity);
  const safeQuantity = Number.isFinite(numericQuantity)
    ? Math.max(1, Math.floor(numericQuantity))
    : 1;
  const existingEntry = plants.find(
    (entry) => entry.plantId === normalizedPlantId,
  );

  if (existingEntry) {
    return plants.map((entry) =>
      entry.plantId === normalizedPlantId
        ? { ...entry, quantity: safeQuantity }
        : entry,
    );
  }

  return [
    ...plants,
    {
      plantId: normalizedPlantId,
      quantity: safeQuantity,
      notes: null,
    },
  ];
}

export function removeAquariumPlantEntry(
  plants: AquariumPlantEntry[],
  plantId: string,
): AquariumPlantEntry[] {
  return plants.filter((entry) => entry.plantId !== plantId);
}

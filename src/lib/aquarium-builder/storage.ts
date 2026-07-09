import type {
  AquariumBuild,
  AquariumFiltrationLevel,
  AquariumLivestockEntry,
  AquariumPlantEntry,
  AquariumPlantedLevel,
} from "@/lib/aquarium-builder/types";

export const AQUARIUM_BUILDER_STORAGE_KEY = "guidemytank:aquarium-builder";

export const defaultAquariumBuild: AquariumBuild = {
  tank: {
    sizeGallons: 0,
    filtrationLevel: "standard",
    plantedLevel: "none",
  },
  livestock: [],
  plants: [],
  equipment: [],
};

function isFiltrationLevel(value: unknown): value is AquariumFiltrationLevel {
  return value === "low" || value === "standard" || value === "high";
}

function isPlantedLevel(value: unknown): value is AquariumPlantedLevel {
  return (
    value === "none" ||
    value === "light" ||
    value === "moderate" ||
    value === "heavy"
  );
}

export function normalizeAquariumLivestock(
  livestock: unknown,
): AquariumLivestockEntry[] {
  if (!Array.isArray(livestock)) {
    return [];
  }

  const entriesBySlug = new Map<string, AquariumLivestockEntry>();

  for (const entry of livestock) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    const rawEntry = entry as Partial<AquariumLivestockEntry>;
    const speciesSlug =
      typeof rawEntry.speciesSlug === "string"
        ? rawEntry.speciesSlug.trim()
        : "";
    const quantity = Number(rawEntry.quantity);

    if (!speciesSlug || !Number.isFinite(quantity)) {
      continue;
    }

    const safeQuantity = Math.max(1, Math.floor(quantity));
    const currentEntry = entriesBySlug.get(speciesSlug);

    entriesBySlug.set(speciesSlug, {
      speciesSlug,
      quantity: (currentEntry?.quantity ?? 0) + safeQuantity,
      notes: typeof rawEntry.notes === "string" ? rawEntry.notes : null,
    });
  }

  return Array.from(entriesBySlug.values());
}

export function normalizeAquariumPlants(plants: unknown): AquariumPlantEntry[] {
  if (!Array.isArray(plants)) {
    return [];
  }

  const entriesBySlug = new Map<string, AquariumPlantEntry>();

  for (const entry of plants) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    const rawEntry = entry as Partial<AquariumPlantEntry>;
    const plantSlug =
      typeof rawEntry.plantSlug === "string" ? rawEntry.plantSlug.trim() : "";
    const quantity = Number(rawEntry.quantity);

    if (!plantSlug || !Number.isFinite(quantity)) {
      continue;
    }

    const safeQuantity = Math.max(1, Math.floor(quantity));
    const currentEntry = entriesBySlug.get(plantSlug);

    entriesBySlug.set(plantSlug, {
      plantSlug,
      quantity: (currentEntry?.quantity ?? 0) + safeQuantity,
      notes: typeof rawEntry.notes === "string" ? rawEntry.notes : null,
    });
  }

  return Array.from(entriesBySlug.values());
}

export function parseAquariumBuild(value: string | null): AquariumBuild {
  if (!value) {
    return defaultAquariumBuild;
  }

  try {
    const parsedValue = JSON.parse(value) as Partial<AquariumBuild>;
    const tank = parsedValue.tank ?? defaultAquariumBuild.tank;

    return {
      ...defaultAquariumBuild,
      ...parsedValue,
      tank: {
        sizeGallons:
          typeof tank.sizeGallons === "number" &&
          Number.isFinite(tank.sizeGallons) &&
          tank.sizeGallons > 0
            ? tank.sizeGallons
            : defaultAquariumBuild.tank.sizeGallons,
        filtrationLevel: isFiltrationLevel(tank.filtrationLevel)
          ? tank.filtrationLevel
          : defaultAquariumBuild.tank.filtrationLevel,
        plantedLevel: isPlantedLevel(tank.plantedLevel)
          ? tank.plantedLevel
          : defaultAquariumBuild.tank.plantedLevel,
        notes: typeof tank.notes === "string" ? tank.notes : null,
      },
      livestock: normalizeAquariumLivestock(parsedValue.livestock),
      plants: normalizeAquariumPlants(parsedValue.plants),
      equipment: Array.isArray(parsedValue.equipment)
        ? parsedValue.equipment
        : defaultAquariumBuild.equipment,
    };
  } catch {
    return defaultAquariumBuild;
  }
}

export function serializeAquariumBuild(build: AquariumBuild) {
  return JSON.stringify({
    ...build,
    livestock: normalizeAquariumLivestock(build.livestock),
    plants: normalizeAquariumPlants(build.plants),
  });
}

import type {
  AquariumBuild,
  AquariumEquipmentCategory,
  AquariumEquipmentProduct,
  AquariumEquipmentProductSelections,
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
  equipmentProductIds: {},
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

function isEquipmentCategory(value: unknown): value is AquariumEquipmentCategory {
  return (
    value === "tank" ||
    value === "filter" ||
    value === "heater" ||
    value === "lighting" ||
    value === "substrate" ||
    value === "hardscape" ||
    value === "maintenance" ||
    value === "water-treatment" ||
    value === "food" ||
    value === "other"
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

export function normalizeAquariumEquipment(
  equipment: unknown,
): AquariumEquipmentProduct[] {
  if (!Array.isArray(equipment)) {
    return [];
  }

  const normalizedEquipment: AquariumEquipmentProduct[] = [];

  for (const entry of equipment) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    const rawEntry = entry as Partial<AquariumEquipmentProduct>;
    const name = typeof rawEntry.name === "string" ? rawEntry.name.trim() : "";
    const quantity = Number(rawEntry.quantity);
    const estimatedPrice = Number(rawEntry.estimatedPrice);

    if (!name || !isEquipmentCategory(rawEntry.category)) {
      continue;
    }

    const normalizedEntry: AquariumEquipmentProduct = {
      name,
      category: rawEntry.category,
      quantity: Number.isInteger(quantity) && quantity > 0 ? quantity : 1,
      estimatedPrice:
        Number.isFinite(estimatedPrice) && estimatedPrice >= 0
          ? estimatedPrice
          : 0,
      flowRateGph:
        typeof rawEntry.flowRateGph === "number" &&
        Number.isFinite(rawEntry.flowRateGph) &&
        rawEntry.flowRateGph > 0
          ? rawEntry.flowRateGph
          : null,
      imageUrl:
        typeof rawEntry.imageUrl === "string" ? rawEntry.imageUrl : null,
      productUrl:
        typeof rawEntry.productUrl === "string" ? rawEntry.productUrl : null,
      notes: typeof rawEntry.notes === "string" ? rawEntry.notes : null,
    };

    if (typeof rawEntry.productId === "string" && rawEntry.productId.trim()) {
      normalizedEntry.productId = rawEntry.productId.trim();
    }

    normalizedEquipment.push(normalizedEntry);
  }

  return normalizedEquipment;
}

export function deriveAquariumEquipmentProductSelections(
  equipment: AquariumEquipmentProduct[],
): AquariumEquipmentProductSelections {
  const selections: AquariumEquipmentProductSelections = {};

  for (const item of equipment) {
    if (!item.productId) {
      continue;
    }

    if (item.category === "tank") {
      selections.tankProductId = item.productId;
    }

    if (item.category === "filter") {
      selections.filterProductId = item.productId;
    }

    if (item.category === "heater") {
      selections.heaterProductId = item.productId;
    }

    if (item.category === "lighting") {
      selections.lightingProductId = item.productId;
    }

    if (item.category === "substrate") {
      selections.substrateProductId = item.productId;
    }

    if (item.category === "hardscape") {
      selections.decorProductIds = Array.from(
        new Set([...(selections.decorProductIds ?? []), item.productId]),
      );
    }
  }

  return selections;
}

export function normalizeAquariumEquipmentProductSelections(
  value: unknown,
  equipment: AquariumEquipmentProduct[],
): AquariumEquipmentProductSelections {
  const derivedSelections = deriveAquariumEquipmentProductSelections(equipment);

  if (!value || typeof value !== "object") {
    return derivedSelections;
  }

  const rawSelections = value as Partial<AquariumEquipmentProductSelections>;

  return {
    ...derivedSelections,
    tankProductId:
      typeof rawSelections.tankProductId === "string"
        ? rawSelections.tankProductId
        : derivedSelections.tankProductId,
    filterProductId:
      typeof rawSelections.filterProductId === "string"
        ? rawSelections.filterProductId
        : derivedSelections.filterProductId,
    heaterProductId:
      typeof rawSelections.heaterProductId === "string"
        ? rawSelections.heaterProductId
        : derivedSelections.heaterProductId,
    lightingProductId:
      typeof rawSelections.lightingProductId === "string"
        ? rawSelections.lightingProductId
        : derivedSelections.lightingProductId,
    substrateProductId:
      typeof rawSelections.substrateProductId === "string"
        ? rawSelections.substrateProductId
        : derivedSelections.substrateProductId,
    decorProductIds: Array.isArray(rawSelections.decorProductIds)
      ? rawSelections.decorProductIds.filter(
          (productId): productId is string => typeof productId === "string",
        )
      : derivedSelections.decorProductIds,
  };
}

export function parseAquariumBuild(value: string | null): AquariumBuild {
  if (!value) {
    return defaultAquariumBuild;
  }

  try {
    const parsedValue = JSON.parse(value) as Partial<AquariumBuild>;
    const tank = parsedValue.tank ?? defaultAquariumBuild.tank;
    const equipment = normalizeAquariumEquipment(parsedValue.equipment);

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
      equipment,
      equipmentProductIds: normalizeAquariumEquipmentProductSelections(
        parsedValue.equipmentProductIds,
        equipment,
      ),
    };
  } catch {
    return defaultAquariumBuild;
  }
}

export function serializeAquariumBuild(build: AquariumBuild) {
  const equipment = normalizeAquariumEquipment(build.equipment);

  return JSON.stringify({
    ...build,
    livestock: normalizeAquariumLivestock(build.livestock),
    plants: normalizeAquariumPlants(build.plants),
    equipment,
    equipmentProductIds: normalizeAquariumEquipmentProductSelections(
      build.equipmentProductIds,
      equipment,
    ),
  });
}

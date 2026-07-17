import {
  plantCareLevels,
  plantGrowthRates,
  plantLightLevels,
  plantPlacements,
  type Plant,
  type PlantCareLevel,
  type PlantDatabaseRow,
  type PlantGrowthRate,
  type PlantLightLevel,
  type PlantPlacement,
} from "./types";

function mapControlledValue<T extends string>(
  value: string,
  allowedValues: readonly T[],
  fieldName: string,
): T {
  if (allowedValues.includes(value as T)) {
    return value as T;
  }

  throw new Error(`Plant record has an invalid ${fieldName}.`);
}

function mapNullableControlledValue<T extends string>(
  value: string | null,
  allowedValues: readonly T[],
  fieldName: string,
): T | null {
  return value == null
    ? null
    : mapControlledValue(value, allowedValues, fieldName);
}

export function mapPlantDatabaseRow(row: PlantDatabaseRow): Plant {
  return {
    id: row.id,
    slug: row.slug,
    commonName: row.common_name,
    scientificName: row.scientific_name,
    description: row.description,
    careLevel: mapControlledValue<PlantCareLevel>(
      row.care_level,
      plantCareLevels,
      "care level",
    ),
    growthRate: mapNullableControlledValue<PlantGrowthRate>(
      row.growth_rate,
      plantGrowthRates,
      "growth rate",
    ),
    placement: mapNullableControlledValue<PlantPlacement>(
      row.placement,
      plantPlacements,
      "placement",
    ),
    minimumTankGallons: row.minimum_tank_gallons,
    minimumTemperatureF: row.minimum_temperature_f,
    maximumTemperatureF: row.maximum_temperature_f,
    minimumPh: row.minimum_ph,
    maximumPh: row.maximum_ph,
    minimumLightLevel: mapNullableControlledValue<PlantLightLevel>(
      row.minimum_light_level,
      plantLightLevels,
      "minimum light level",
    ),
    maximumLightLevel: mapNullableControlledValue<PlantLightLevel>(
      row.maximum_light_level,
      plantLightLevels,
      "maximum light level",
    ),
    co2Required: row.co2_required,
    maximumHeightInches: row.maximum_height_inches,
    imageUrl: row.image_url,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

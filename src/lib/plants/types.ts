import type { Database } from "@/types/database.types";

export const plantCareLevels = [
  "beginner",
  "intermediate",
  "advanced",
] as const;

export const plantGrowthRates = ["slow", "moderate", "fast"] as const;

export const plantPlacements = [
  "foreground",
  "midground",
  "background",
  "floating",
  "epiphyte",
] as const;

export const plantLightLevels = ["low", "medium", "high"] as const;

export type PlantCareLevel = (typeof plantCareLevels)[number];
export type PlantGrowthRate = (typeof plantGrowthRates)[number];
export type PlantPlacement = (typeof plantPlacements)[number];
export type PlantLightLevel = (typeof plantLightLevels)[number];

export type PlantDatabaseRow =
  Database["public"]["Tables"]["plants"]["Row"];

export interface Plant {
  id: string;
  slug: string;
  commonName: string;
  scientificName: string;
  description: string | null;
  careLevel: PlantCareLevel;
  growthRate: PlantGrowthRate | null;
  placement: PlantPlacement | null;
  minimumTankGallons: number | null;
  minimumTemperatureF: number | null;
  maximumTemperatureF: number | null;
  minimumPh: number | null;
  maximumPh: number | null;
  minimumLightLevel: PlantLightLevel | null;
  maximumLightLevel: PlantLightLevel | null;
  co2Required: boolean;
  maximumHeightInches: number | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

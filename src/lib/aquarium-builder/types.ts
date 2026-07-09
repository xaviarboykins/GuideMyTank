import type { CompatibilityResult } from "@/lib/compatibility/types";
import type { Database } from "@/types/database.types";

export type AquariumSpecies = Database["public"]["Tables"]["species"]["Row"];

export type AquariumFiltrationLevel = "low" | "standard" | "high";

export type AquariumPlantedLevel = "none" | "light" | "moderate" | "heavy";

export type AquariumEquipmentCategory =
  | "filter"
  | "heater"
  | "lighting"
  | "substrate"
  | "hardscape"
  | "maintenance"
  | "water-treatment"
  | "food"
  | "other";

export type AquariumBuilderSeverity = "info" | "warning" | "critical";

export type AquariumTankConfiguration = {
  sizeGallons: number;
  filtrationLevel: AquariumFiltrationLevel;
  plantedLevel: AquariumPlantedLevel;
  notes?: string | null;
};

export type AquariumLivestockEntry = {
  speciesSlug: string;
  quantity: number;
  notes?: string | null;
};

export type AquariumPlantEntry = {
  plantSlug: string;
  quantity: number;
  notes?: string | null;
};

export type AquariumResolvedLivestockEntry = AquariumLivestockEntry & {
  species: AquariumSpecies;
};

export type AquariumEquipmentProduct = {
  name: string;
  category: AquariumEquipmentCategory;
  quantity: number;
  estimatedPrice: number;
  productUrl?: string | null;
  notes?: string | null;
};

export type AquariumEstimatedCost = {
  equipmentSubtotal: number;
  totalEstimatedCost: number;
  currency: "USD";
};

export type AquariumBuilderWarning = {
  code: string;
  message: string;
  severity: AquariumBuilderSeverity;
  livestock?: AquariumLivestockEntry[];
};

export type AquariumBuilderRecommendation = {
  code: string;
  message: string;
  severity: AquariumBuilderSeverity;
  livestock?: AquariumLivestockEntry[];
};

export type AquariumAnalysis = {
  compatibility: CompatibilityResult[];
  warnings: AquariumBuilderWarning[];
  recommendations: AquariumBuilderRecommendation[];
};

export type AquariumBuild = {
  id?: string;
  tank: AquariumTankConfiguration;
  livestock: AquariumLivestockEntry[];
  plants: AquariumPlantEntry[];
  equipment: AquariumEquipmentProduct[];
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  expiresAt?: string;
};

export type AquariumBuilderResult = {
  build: AquariumBuild;
  livestock: AquariumResolvedLivestockEntry[];
  estimatedCost: AquariumEstimatedCost;
  analysis: AquariumAnalysis;
};

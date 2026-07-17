import type { CompatibilityResult } from "@/lib/compatibility/types";
import type { StockingAnalysisResult } from "@/lib/aquarium-builder/stocking-analysis/types";
import type { AquariumValidationReport } from "@/lib/aquarium-validation/types";
import type { AquariumBuildHealth } from "@/lib/aquarium-analysis/build-health";
import type { Database } from "@/types/database.types";

export type AquariumSpecies = Database["public"]["Tables"]["species"]["Row"];

export type AquariumFiltrationLevel = "low" | "standard" | "high";

export type AquariumPlantedLevel = "none" | "light" | "moderate" | "heavy";

export type AquariumEquipmentCategory =
  | "tank"
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
  plantId: string;
  quantity: number;
  notes?: string | null;
};

export type AquariumResolvedLivestockEntry = AquariumLivestockEntry & {
  species: AquariumSpecies;
};

export type AquariumEquipmentProduct = {
  productId?: string;
  name: string;
  category: AquariumEquipmentCategory;
  quantity: number;
  estimatedPrice: number;
  flowRateGph?: number | null;
  imageUrl?: string | null;
  productUrl?: string | null;
  notes?: string | null;
};

export type AquariumEquipmentProductSelections = {
  tankProductId?: string;
  filterProductId?: string;
  heaterProductId?: string;
  lightingProductId?: string;
  substrateProductId?: string;
  decorProductIds?: string[];
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
  stocking: StockingAnalysisResult;
  validation: AquariumValidationReport;
  buildHealth: AquariumBuildHealth;
  warnings: AquariumBuilderWarning[];
  recommendations: AquariumBuilderRecommendation[];
};

export type AquariumBuild = {
  id?: string;
  tank: AquariumTankConfiguration;
  livestock: AquariumLivestockEntry[];
  plants: AquariumPlantEntry[];
  equipment: AquariumEquipmentProduct[];
  equipmentProductIds?: AquariumEquipmentProductSelections;
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

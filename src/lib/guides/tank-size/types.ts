import type { SpeciesRow } from "../../compatibility/types";
import type { Product } from "../../products/types";

export type TankSizeGuideVariation = "general" | "community";

export type TankSizeGuideInput = {
  gallons: number;
  variation: TankSizeGuideVariation;
};

export type TankSizeGuideline = {
  id: string;
  speciesId: string;
  gallons: number;
  scenario: string;
  notes: string | null;
};

export type TankSizeCareGuide = {
  id: string;
  slug: string | null;
  title: string | null;
  speciesSlug: string;
};

export type TankSizeGuideData = {
  species: SpeciesRow[];
  guidelines: TankSizeGuideline[];
  careGuides: TankSizeCareGuide[];
  products: Product[];
};

export type TankSizeSuitability = {
  suitable: SpeciesRow[];
  excludedMissingStockingProfile: SpeciesRow[];
  excludedSpecialist: SpeciesRow[];
  excludedByVariation: SpeciesRow[];
};


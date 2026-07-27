import type {
  CompatibilityResult,
  SpeciesRow,
} from "../../compatibility/types";

export type TankMateGuideVariant = "tank-mates" | "avoid-with";

export type TankMateGuideInput = {
  speciesSlug: string;
  variant: TankMateGuideVariant;
};

export type TankMateCareGuide = {
  id: string;
  slug: string | null;
  title: string | null;
  speciesSlug: string;
};

export type TankMateSourceReference = {
  id: string;
  sourceUrl: string;
  sourceLabel: string | null;
  sourceCategory: string;
  confidence: string;
  updatedAt: string;
};

export type TankMateGuideData = {
  targetSpecies: SpeciesRow;
  candidates: SpeciesRow[];
  compatibilityResults: CompatibilityResult[];
  careGuides: TankMateCareGuide[];
  sourceReferences: TankMateSourceReference[];
};

export type TankMateRecommendationGroups = {
  recommended: CompatibilityResult[];
  conditional: CompatibilityResult[];
  avoid: CompatibilityResult[];
  excludedLowConfidence: CompatibilityResult[];
};


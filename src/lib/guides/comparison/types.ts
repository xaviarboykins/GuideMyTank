import type {
  CompatibilityResult,
  SpeciesRow,
} from "../../compatibility/types";

export type ComparisonGuideInput = {
  speciesASlug: string;
  speciesBSlug: string;
};

export type ComparisonCareGuide = {
  id: string;
  slug: string | null;
  title: string | null;
  speciesSlug: string;
};

export type ComparisonSourceReference = {
  id: string;
  speciesId: string;
  sourceUrl: string;
  sourceLabel: string | null;
  sourceCategory: string;
  confidence: string;
  updatedAt: string;
};

export type ComparisonGuideData = {
  speciesA: SpeciesRow;
  speciesB: SpeciesRow;
  compatibility: CompatibilityResult;
  careGuides: ComparisonCareGuide[];
  sourceReferences: ComparisonSourceReference[];
};


export const DEFAULT_INTERNAL_LINK_LIMIT = 6;
export const MAX_INTERNAL_LINK_LIMIT = 12;

export const DEFAULT_RELATED_SPECIES_LIMIT = 6;
export const DEFAULT_RELATED_SPECIES_THRESHOLD = 35;
export const MIN_RELATED_SPECIES_SIGNALS = 4;
export const MIN_RELATED_SPECIES_COMPARABLE_WEIGHT = 40;

export const MAX_SHARED_SPECIES_REPORTS = 4;
export const MAX_RELATED_COMPATIBILITY_REPORTS = 6;

export const RELATED_CONTENT_WEIGHTS = {
  explicitRelationship: 100,
  sharedSpecies: 50,
  sharedCategory: 15,
  sharedTag: 10,
} as const;

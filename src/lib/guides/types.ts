import type { Json } from "@/types/database.types";

export const GUIDE_CONTENT_TYPE = "guide" as const;

export const IMPLEMENTED_GUIDE_FAMILIES = [
  "species_comparison",
  "tank_mates",
  "tank_size",
] as const;

export type ImplementedGuideFamily =
  (typeof IMPLEMENTED_GUIDE_FAMILIES)[number];

export type GuideFamily = ImplementedGuideFamily | (string & {});

export const GUIDE_REGENERATION_STATUSES = [
  "current",
  "review_required",
  "proposal_ready",
  "blocked",
] as const;

export type GuideRegenerationStatus =
  (typeof GUIDE_REGENERATION_STATUSES)[number];

export const GUIDE_SEARCH_INTENT_CONFLICT_STATUSES = [
  "none",
  "potential",
  "exact",
  "resolved",
] as const;

export type GuideSearchIntentConflictStatus =
  (typeof GUIDE_SEARCH_INTENT_CONFLICT_STATUSES)[number];

export type GuideMetadataInput = {
  guideFamily: GuideFamily;
  guideType: string;
  programmaticOrigin?: string;
  generationKey: string;
  generationMetadata?: Json;
  primarySearchIntent: string;
  normalizedSearchIntent: string;
  sourceDataFingerprint?: string | null;
  sourceDataVersion?: string | null;
  sourceDataModifiedAt?: string | null;
  generatedContentHash?: string | null;
  currentContentHash?: string | null;
};

export type GuideSourceEntityInput = {
  entityType: string;
  entityKey: string;
  contributionRole?: string;
  sourceVersion?: string | null;
  sourceUpdatedAt?: string | null;
  sourceFingerprint?: string | null;
};


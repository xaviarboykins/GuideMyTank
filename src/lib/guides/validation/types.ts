import type { Json } from "../../../types/database.types";
import type { GuideFamily } from "../types";

export type GuideValidationSection = {
  blockType: string;
  content: Json;
};

export type GuideValidationMetadata = {
  guideFamily: GuideFamily;
  guideType: string;
  generationKey: string;
  generationMetadata: Json;
  primarySearchIntent: string;
  normalizedSearchIntent: string;
  searchIntentConflictStatus: string;
  sourceDataFingerprint: string | null;
  generatedContentHash: string | null;
  currentContentHash: string | null;
  manualEditsDetected: boolean;
};

export type GuidePublicationValidationInput = {
  id: string;
  title: string | null;
  slug: string | null;
  summary: string | null;
  seoTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  sections: GuideValidationSection[];
  metadata: GuideValidationMetadata;
  generationKeyUnique: boolean;
  normalizedSearchIntentUnique: boolean;
  slugUnique: boolean;
  canonicalUrlUnique: boolean;
  conflictErrors?: Array<{
    field: string;
    code: string;
    message: string;
  }>;
  conflictWarnings?: Array<{
    field: string;
    code: string;
    message: string;
  }>;
};


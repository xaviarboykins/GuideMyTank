import type { Json } from "@/types/database.types";

import type {
  GuideFamily,
  GuideSourceEntityInput,
} from "../types";

export type GeneratedGuideSection = {
  blockType:
    | "heading"
    | "paragraph"
    | "list"
    | "comparison_table"
    | "tip"
    | "warning"
    | "faq_group"
    | "image"
    | "related_content";
  content: Json;
};

export type GeneratedGuideDraft = {
  title: string;
  slug: string;
  summary: string;
  seoTitle: string;
  metaDescription: string;
  primarySearchIntent: string;
  sections: GeneratedGuideSection[];
  sourceEntities: GuideSourceEntityInput[];
  generationMetadata: Json;
};

export type GuideGenerationRequest<TInput> = {
  family: GuideFamily;
  guideType: string;
  generationKey: string;
  input: TInput;
};

export interface GuideGenerator<TInput> {
  readonly family: GuideFamily;
  readonly guideType: string;
  generate(
    request: GuideGenerationRequest<TInput>,
  ): Promise<GeneratedGuideDraft>;
}

export type GuideGenerationResult =
  | {
      outcome: "created" | "regenerated";
      articleId: string;
      generationKey: string;
    }
  | {
      outcome: "review_required";
      articleId: string;
      generationKey: string;
      reason: string;
    };

export type GuideRegenerationProposalDraft = GeneratedGuideDraft & {
  normalizedSearchIntent: string;
  generatedContentHash: string;
  sourceDataFingerprint: string;
  sourceDataVersion: string | null;
  sourceDataModifiedAt: string | null;
};

export type GuideRegenerationProposal = {
  version: 1;
  proposalHash: string;
  generatedAt: string;
  reason: string;
  draft: GuideRegenerationProposalDraft;
};

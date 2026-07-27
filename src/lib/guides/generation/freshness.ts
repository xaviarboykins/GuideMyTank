import {
  createGeneratedContentHash,
  createPersistedContentHash,
  createSourceDataFingerprint,
} from "./fingerprint";
import type {
  GeneratedGuideDraft,
  GeneratedGuideSection,
} from "./types";

export function detectGuideManualEdits(input: {
  generatedContentHash: string | null;
  title: string | null;
  slug: string | null;
  summary: string | null;
  seoTitle: string | null;
  metaDescription: string | null;
  sections: GeneratedGuideSection[];
}) {
  const currentContentHash = createPersistedContentHash({
    title: input.title,
    slug: input.slug,
    summary: input.summary,
    seoTitle: input.seoTitle,
    metaDescription: input.metaDescription,
    sections: input.sections,
  });
  return {
    currentContentHash,
    manualEditsDetected: Boolean(
      input.generatedContentHash &&
        input.generatedContentHash !== currentContentHash,
    ),
  };
}

export function inspectGeneratedGuideFreshness(
  stored: {
    generatedContentHash: string | null;
    sourceDataFingerprint: string | null;
  },
  candidate: GeneratedGuideDraft,
) {
  const generatedContentHash = createGeneratedContentHash(candidate);
  const sourceDataFingerprint = createSourceDataFingerprint(
    candidate.sourceEntities,
  );

  return {
    generatedContentHash,
    sourceDataFingerprint,
    contentChanged: stored.generatedContentHash !== generatedContentHash,
    sourceChanged:
      stored.sourceDataFingerprint !== sourceDataFingerprint,
    requiresRegeneration:
      stored.generatedContentHash !== generatedContentHash ||
      stored.sourceDataFingerprint !== sourceDataFingerprint,
  };
}

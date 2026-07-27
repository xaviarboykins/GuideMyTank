import { describe, expect, it } from "vitest";

import {
  createGeneratedContentHash,
  createGuideRegenerationProposal,
  createSourceDataFingerprint,
} from "./fingerprint";
import {
  detectGuideManualEdits,
  inspectGeneratedGuideFreshness,
} from "./freshness";
import type { GeneratedGuideDraft } from "./types";

const draft: GeneratedGuideDraft = {
  title: "Betta tank mates",
  slug: "betta-tank-mates",
  summary: "Compatible species.",
  seoTitle: "Betta Tank Mates",
  metaDescription: "Compatible tank mates for betta fish.",
  primarySearchIntent: "betta tank mates",
  sections: [{ blockType: "paragraph", content: { text: "Keep watch." } }],
  sourceEntities: [
    {
      entityType: "species",
      entityKey: "betta-splendens",
      sourceVersion: "1",
    },
  ],
  generationMetadata: { speciesSlug: "betta-splendens" },
};

describe("Guide regeneration freshness", () => {
  it("detects persisted manual edits from the generated baseline", () => {
    const generatedContentHash = createGeneratedContentHash(draft);
    const result = detectGuideManualEdits({
      generatedContentHash,
      title: draft.title,
      slug: draft.slug,
      summary: "Editor changed this.",
      seoTitle: draft.seoTitle,
      metaDescription: draft.metaDescription,
      sections: draft.sections,
    });

    expect(result.manualEditsDetected).toBe(true);
    expect(result.currentContentHash).not.toBe(generatedContentHash);
  });

  it("reports a current candidate when content and sources are unchanged", () => {
    const result = inspectGeneratedGuideFreshness(
      {
        generatedContentHash: createGeneratedContentHash(draft),
        sourceDataFingerprint: createSourceDataFingerprint(
          draft.sourceEntities,
        ),
      },
      draft,
    );

    expect(result.requiresRegeneration).toBe(false);
  });

  it("creates stable proposal hashes independent of proposal time", () => {
    const proposalDraft = {
      ...draft,
      normalizedSearchIntent: "betta tank mates",
      generatedContentHash: createGeneratedContentHash(draft),
      sourceDataFingerprint: createSourceDataFingerprint(
        draft.sourceEntities,
      ),
      sourceDataVersion: "1",
      sourceDataModifiedAt: null,
    };
    const first = createGuideRegenerationProposal(
      proposalDraft,
      "Source changed.",
      "2026-01-01T00:00:00.000Z",
    );
    const second = createGuideRegenerationProposal(
      proposalDraft,
      "Source changed.",
      "2026-02-01T00:00:00.000Z",
    );

    expect(first.proposalHash).toBe(second.proposalHash);
  });
});

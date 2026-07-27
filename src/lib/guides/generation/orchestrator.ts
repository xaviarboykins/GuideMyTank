import "server-only";

import { ARTICLE_BLOCK_TYPES } from "@/lib/articles/validation";
import { normalizeContentSlug } from "@/lib/content/slug";
import { ContentServiceError } from "@/lib/content/errors";
import { validateArticleBlockContent } from "@/lib/content/structured-data";
import {
  createGuideDraftFoundation,
  getAdminGuideGenerationSnapshot,
  saveGeneratedGuideDraft,
  storeGuideRegenerationProposal,
  updateGuideContentHashState,
} from "@/lib/guides/repository";

import {
  createGeneratedContentHash,
  createGuideRegenerationProposal,
  createPersistedContentHash,
  createSourceDataFingerprint,
  getLatestSourceModifiedAt,
} from "./fingerprint";
import { normalizeSearchIntent } from "./identity";
import { decideGuideDraftRegeneration } from "./regeneration-policy";
import type {
  GuideGenerationRequest,
  GuideGenerationResult,
  GuideGenerator,
  GeneratedGuideSection,
} from "./types";

function requireGeneratedText(value: string, label: string) {
  const normalized = value.trim();
  if (!normalized) {
    throw new ContentServiceError(
      `The generator did not produce a ${label}.`,
      "validation",
    );
  }
  return normalized;
}

function toGeneratedSections(
  sections: Array<{ block_type: string; content: GeneratedGuideSection["content"] }>,
) {
  return sections.map((section) => {
    if (
      !ARTICLE_BLOCK_TYPES.includes(
        section.block_type as (typeof ARTICLE_BLOCK_TYPES)[number],
      )
    ) {
      throw new ContentServiceError(
        "The existing Guide contains an unknown content block.",
        "validation",
      );
    }

    return {
      blockType: section.block_type as GeneratedGuideSection["blockType"],
      content: section.content,
    };
  });
}

export async function generateOrRegenerateGuideDraft<TInput>(
  request: GuideGenerationRequest<TInput>,
  generator: GuideGenerator<TInput>,
): Promise<GuideGenerationResult> {
  if (
    generator.family !== request.family ||
    generator.guideType !== request.guideType
  ) {
    throw new ContentServiceError(
      "The selected generator does not match the requested Guide family and type.",
      "validation",
    );
  }

  const generated = await generator.generate(request);
  const title = requireGeneratedText(generated.title, "title");
  const slug = normalizeContentSlug(
    requireGeneratedText(generated.slug, "slug"),
  );
  const summary = requireGeneratedText(generated.summary, "summary");
  const seoTitle = requireGeneratedText(generated.seoTitle, "SEO title");
  const metaDescription = requireGeneratedText(
    generated.metaDescription,
    "meta description",
  );
  const primarySearchIntent = requireGeneratedText(
    generated.primarySearchIntent,
    "primary search intent",
  );
  const normalizedSearchIntent = normalizeSearchIntent(primarySearchIntent);

  if (!slug || !normalizedSearchIntent || !generated.sections.length) {
    throw new ContentServiceError(
      "The generator produced incomplete Guide content.",
      "validation",
    );
  }

  for (const section of generated.sections) {
    const validation = validateArticleBlockContent(
      section.blockType,
      section.content,
    );
    if (!validation.valid) {
      throw new ContentServiceError(
        validation.issues[0].message,
        "validation",
      );
    }
  }

  const normalizedDraft = {
    ...generated,
    title,
    slug,
    summary,
    seoTitle,
    metaDescription,
    primarySearchIntent,
  };
  const generatedContentHash = createGeneratedContentHash(normalizedDraft);
  const sourceDataFingerprint = createSourceDataFingerprint(
    generated.sourceEntities,
  );
  const sourceDataModifiedAt = getLatestSourceModifiedAt(
    generated.sourceEntities,
  );
  const existing = await getAdminGuideGenerationSnapshot(
    request.generationKey,
  );

  let articleId: string;
  let outcome: "created" | "regenerated";

  if (existing) {
    const persistedContentHash = createPersistedContentHash({
      title: existing.article.title,
      slug: existing.article.slug,
      summary: existing.article.summary,
      seoTitle: existing.article.seo_title,
      metaDescription: existing.article.meta_description,
      sections: toGeneratedSections(existing.sections),
    });
    const decision = decideGuideDraftRegeneration({
      status: existing.article.status,
      manualEditsDetected:
        existing.metadata.manual_edits_detected ||
        Boolean(
          existing.metadata.generated_content_hash &&
            existing.metadata.generated_content_hash !== persistedContentHash,
        ),
      generatedContentHash: existing.metadata.generated_content_hash,
      persistedContentHash,
    });

    if (!decision.allowed) {
      const manualEditsDetected = Boolean(
        existing.metadata.generated_content_hash &&
          existing.metadata.generated_content_hash !== persistedContentHash,
      );
      await updateGuideContentHashState(
        existing.article.id,
        persistedContentHash,
        manualEditsDetected,
      );
      const proposal = createGuideRegenerationProposal(
        {
          ...normalizedDraft,
          normalizedSearchIntent,
          generatedContentHash,
          sourceDataFingerprint,
          sourceDataVersion: sourceDataFingerprint,
          sourceDataModifiedAt,
        },
        decision.reason,
      );
      await storeGuideRegenerationProposal(existing.article.id, proposal);
      return {
        outcome: "review_required",
        articleId: existing.article.id,
        generationKey: request.generationKey,
        reason: decision.reason,
      };
    }

    articleId = existing.article.id;
    outcome = "regenerated";
  } else {
    articleId = await createGuideDraftFoundation(title, {
      guideFamily: request.family,
      guideType: request.guideType,
      generationKey: request.generationKey,
      generationMetadata: generated.generationMetadata,
      primarySearchIntent,
      normalizedSearchIntent,
      sourceDataFingerprint,
      sourceDataVersion: sourceDataFingerprint,
      sourceDataModifiedAt,
    });
    outcome = "created";
  }

  await saveGeneratedGuideDraft(articleId, {
    ...normalizedDraft,
    normalizedSearchIntent,
    generatedContentHash,
    sourceDataFingerprint,
    sourceDataVersion: sourceDataFingerprint,
    sourceDataModifiedAt,
  });

  return { outcome, articleId, generationKey: request.generationKey };
}

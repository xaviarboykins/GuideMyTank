import "server-only";

import { assertAdmin } from "@/lib/auth/admin";
import { throwContentDatabaseError } from "@/lib/content/database";
import { createClient } from "@/lib/supabase/server";
import { createStaticClient } from "@/lib/supabase/static";

import type { GuideMetadataInput, GuideSourceEntityInput } from "./types";
import type { GeneratedGuideDraft } from "./generation/types";
import type { GuideRegenerationProposal } from "./generation/types";
import { toJson } from "./generation/fingerprint";
import { validateAdminGuideForPublication } from "./validation/service";

export async function listAdminGuides(query = "", status?: string) {
  await assertAdmin();
  const supabase = await createClient();
  let request = supabase
    .from("programmatic_guide_metadata")
    .select("*,articles!inner(*)")
    .order("updated_at", { referencedTable: "articles", ascending: false });
  const normalizedQuery = query.replace(/[%_,().]/g, " ").trim();
  if (normalizedQuery) {
    request = request.or(
      `title.ilike.%${normalizedQuery}%,slug.ilike.%${normalizedQuery}%`,
      { referencedTable: "articles" },
    );
  }
  if (status) {
    request = request.eq("articles.status", status);
  }
  const { data, error } = await request;
  throwContentDatabaseError(error, "list Guides");
  return data ?? [];
}

export async function listGuideSpeciesChoices() {
  await assertAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("species")
    .select("id,slug,common_name,scientific_name")
    .order("common_name");
  throwContentDatabaseError(error, "load Guide species choices");
  return data ?? [];
}

export async function publishGuide(articleId: string) {
  const validation = await validateAdminGuideForPublication(articleId);
  if (!validation.valid) return validation;
  const supabase = await createClient();
  const { error } = await supabase
    .from("articles")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", articleId)
    .eq("content_type", "guide")
    .eq("status", "draft");
  throwContentDatabaseError(error, "publish the Guide");
  return validation;
}

export async function archiveGuide(articleId: string) {
  await assertAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("articles")
    .update({ status: "archived" })
    .eq("id", articleId)
    .eq("content_type", "guide")
    .eq("status", "published");
  throwContentDatabaseError(error, "archive the Guide");
}

export async function getPublishedGuideBySlug(slug: string) {
  const supabase = createStaticClient();
  const { data: article, error } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .eq("content_type", "guide")
    .eq("status", "published")
    .maybeSingle();
  throwContentDatabaseError(error, "load the published Guide");
  if (!article) return null;

  const [sections, images, sources, categories, tags, relatedArticles, relatedCareGuides, generatedLinks] =
    await Promise.all([
      supabase.from("article_sections").select("*").eq("article_id", article.id).order("display_order"),
      supabase.from("article_images").select("*,content_images(*)").eq("article_id", article.id).order("display_order"),
      supabase.from("article_sources").select("*,sources(*)").eq("article_id", article.id).order("display_order"),
      supabase.from("article_category_assignments").select("*,article_categories(*)").eq("article_id", article.id),
      supabase.from("article_tag_assignments").select("*,article_tags(*)").eq("article_id", article.id),
      supabase.from("article_related_articles").select("*,related_article:articles!article_related_articles_related_article_id_fkey(id,slug,title,summary,status,content_type)").eq("article_id", article.id).order("display_order"),
      supabase.from("article_related_care_guides").select("*,care_guide:care_guides(id,slug,title,summary,status,species:species!care_guides_species_id_fkey(id,slug,common_name,scientific_name))").eq("article_id", article.id).order("display_order"),
      supabase.rpc("get_published_programmatic_guide_links", {
        target_article_id: article.id,
      }),
    ]);
  for (const [result, operation] of [
    [sections, "load published Guide sections"],
    [images, "load published Guide images"],
    [sources, "load published Guide sources"],
    [categories, "load published Guide categories"],
    [tags, "load published Guide tags"],
    [relatedArticles, "load related Guide content"],
    [relatedCareGuides, "load related Guide Care Guides"],
    [generatedLinks, "load generated Guide links"],
  ] as const) throwContentDatabaseError(result.error, operation);

  return {
    article,
    sections: sections.data ?? [],
    images: images.data ?? [],
    sources: sources.data ?? [],
    categories: categories.data ?? [],
    tags: tags.data ?? [],
    relatedArticles: relatedArticles.data ?? [],
    relatedCareGuides: relatedCareGuides.data ?? [],
    generatedInternalLinks: Array.isArray(generatedLinks.data)
      ? generatedLinks.data
      : [],
  };
}

export async function listPublishedGuides() {
  const supabase = createStaticClient();
  const { data, error } = await supabase
    .from("articles")
    .select("id,title,slug,summary,published_at,updated_at,is_featured,featured_image_id,article_images(image_id,display_order,content_images(storage_path,alt_text,caption)),article_category_assignments(category_id,article_categories(name,slug)),programmatic_guide_metadata(guide_family,guide_type)")
    .eq("content_type", "guide")
    .eq("status", "published")
    .order("published_at", { ascending: false });
  throwContentDatabaseError(error, "list published Guides");
  return data ?? [];
}

export async function getPublishedGuidesBySlugs(slugs: string[]) {
  if (!slugs.length) return [];

  const supabase = createStaticClient();
  const { data, error } = await supabase
    .from("articles")
    .select("id,slug,title,summary,content_type")
    .eq("content_type", "guide")
    .eq("status", "published")
    .in("slug", slugs);

  throwContentDatabaseError(error, "load published Guides");
  return data ?? [];
}

export async function getAdminGuideById(articleId: string) {
  await assertAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("articles")
    .select("*,programmatic_guide_metadata(*)")
    .eq("id", articleId)
    .eq("content_type", "guide")
    .maybeSingle();

  throwContentDatabaseError(error, "load the Guide");
  return data;
}

export async function getAdminGuideByGenerationKey(generationKey: string) {
  await assertAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("programmatic_guide_metadata")
    .select("*,articles(*)")
    .eq("generation_key", generationKey)
    .maybeSingle();

  throwContentDatabaseError(error, "load the Guide generation record");
  return data;
}

export async function getAdminGuideGenerationSnapshot(generationKey: string) {
  await assertAdmin();
  const supabase = await createClient();
  const { data: metadata, error: metadataError } = await supabase
    .from("programmatic_guide_metadata")
    .select("*")
    .eq("generation_key", generationKey)
    .maybeSingle();

  throwContentDatabaseError(
    metadataError,
    "load the Guide generation record",
  );
  if (!metadata) return null;

  const [articleResult, sectionsResult] = await Promise.all([
    supabase
      .from("articles")
      .select("*")
      .eq("id", metadata.article_id)
      .eq("content_type", "guide")
      .single(),
    supabase
      .from("article_sections")
      .select("*")
      .eq("article_id", metadata.article_id)
      .order("display_order"),
  ]);

  throwContentDatabaseError(articleResult.error, "load the Guide Draft");
  throwContentDatabaseError(
    sectionsResult.error,
    "load the Guide Draft sections",
  );

  return {
    metadata,
    article: articleResult.data,
    sections: sectionsResult.data ?? [],
  };
}

export async function createGuideDraftFoundation(
  title: string,
  metadata: GuideMetadataInput,
) {
  await assertAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc(
    "create_programmatic_guide_draft",
    {
      draft_title: title,
      draft_guide_family: metadata.guideFamily,
      draft_guide_type: metadata.guideType,
      draft_generation_key: metadata.generationKey,
      draft_primary_search_intent: metadata.primarySearchIntent,
      draft_normalized_search_intent: metadata.normalizedSearchIntent,
      draft_generation_metadata: metadata.generationMetadata ?? {},
      draft_programmatic_origin:
        metadata.programmaticOrigin ?? "structured_data",
      draft_source_data_fingerprint:
        metadata.sourceDataFingerprint ?? undefined,
      draft_source_data_version: metadata.sourceDataVersion ?? undefined,
      draft_source_data_modified_at:
        metadata.sourceDataModifiedAt ?? undefined,
      draft_generated_content_hash:
        metadata.generatedContentHash ?? undefined,
      draft_current_content_hash: metadata.currentContentHash ?? undefined,
    },
  );

  throwContentDatabaseError(error, "create the Guide draft");
  return data;
}

type PersistedGeneratedGuideDraft = GeneratedGuideDraft & {
  normalizedSearchIntent: string;
  generatedContentHash: string;
  sourceDataFingerprint: string;
  sourceDataVersion?: string | null;
  sourceDataModifiedAt?: string | null;
};

export async function saveGeneratedGuideDraft(
  articleId: string,
  draft: PersistedGeneratedGuideDraft,
) {
  await assertAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("save_programmatic_guide_draft", {
    target_article_id: articleId,
    draft_title: draft.title,
    draft_slug: draft.slug,
    draft_summary: draft.summary,
    draft_seo_title: draft.seoTitle,
    draft_meta_description: draft.metaDescription,
    draft_primary_search_intent: draft.primarySearchIntent,
    draft_normalized_search_intent: draft.normalizedSearchIntent,
    draft_sections: draft.sections.map((section, displayOrder) => ({
      block_type: section.blockType,
      content: section.content,
      display_order: displayOrder,
    })),
    draft_generation_metadata: draft.generationMetadata,
    draft_source_entities: draft.sourceEntities.map((entity) => ({
      entity_type: entity.entityType,
      entity_key: entity.entityKey,
      contribution_role: entity.contributionRole ?? "source",
      source_version: entity.sourceVersion ?? null,
      source_updated_at: entity.sourceUpdatedAt ?? null,
      source_fingerprint: entity.sourceFingerprint ?? null,
    })),
    draft_source_data_fingerprint: draft.sourceDataFingerprint,
    draft_source_data_version: draft.sourceDataVersion ?? undefined,
    draft_source_data_modified_at: draft.sourceDataModifiedAt ?? undefined,
    draft_generated_content_hash: draft.generatedContentHash,
  });

  throwContentDatabaseError(error, "save the generated Guide Draft");
}

export async function updateGuideContentHashState(
  articleId: string,
  currentContentHash: string,
  manualEditsDetected: boolean,
) {
  await assertAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("programmatic_guide_metadata")
    .update({
      current_content_hash: currentContentHash,
      manual_edits_detected: manualEditsDetected,
    })
    .eq("article_id", articleId);

  throwContentDatabaseError(error, "update the Guide content hash state");
}

export async function storeGuideRegenerationProposal(
  articleId: string,
  proposal: GuideRegenerationProposal,
) {
  await assertAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("programmatic_guide_metadata")
    .update({
      pending_generation: toJson(proposal),
      last_regeneration_check_at: new Date().toISOString(),
      regeneration_status: "proposal_ready",
      requires_regeneration: true,
      regeneration_reason: proposal.reason,
    })
    .eq("article_id", articleId);

  throwContentDatabaseError(error, "store the Guide regeneration proposal");
}

export async function markGuideSourceCheckCurrent(articleId: string) {
  await assertAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("programmatic_guide_metadata")
    .update({
      last_regeneration_check_at: new Date().toISOString(),
    })
    .eq("article_id", articleId);

  throwContentDatabaseError(error, "record the Guide source freshness check");
}

export async function applyGuideRegenerationProposal(
  articleId: string,
  proposalHash: string,
  confirmPublishedToDraft = false,
) {
  await assertAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc(
    "apply_programmatic_guide_regeneration",
    {
      target_article_id: articleId,
      expected_proposal_hash: proposalHash,
      confirm_published_to_draft: confirmPublishedToDraft,
    },
  );

  throwContentDatabaseError(error, "apply the Guide regeneration proposal");
}

export async function replaceGuideSourceEntities(
  articleId: string,
  entities: GuideSourceEntityInput[],
) {
  await assertAdmin();
  const supabase = await createClient();
  const { error: deleteError } = await supabase
    .from("programmatic_guide_source_entities")
    .delete()
    .eq("article_id", articleId);

  throwContentDatabaseError(deleteError, "replace the Guide source entities");

  if (!entities.length) return [];

  const { data, error } = await supabase
    .from("programmatic_guide_source_entities")
    .insert(
      entities.map((entity) => ({
        article_id: articleId,
        entity_type: entity.entityType,
        entity_key: entity.entityKey,
        contribution_role: entity.contributionRole ?? "source",
        source_version: entity.sourceVersion ?? null,
        source_updated_at: entity.sourceUpdatedAt ?? null,
        source_fingerprint: entity.sourceFingerprint ?? null,
      })),
    )
    .select("*");

  throwContentDatabaseError(error, "save the Guide source entities");
  return data ?? [];
}

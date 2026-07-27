import "server-only";

import { assertAdmin } from "../../auth/admin";
import { throwContentDatabaseError } from "../../content/database";
import { ContentServiceError } from "../../content/errors";
import { createClient } from "../../supabase/server";
import type { GuideFamily } from "../types";

import { findGuideSearchConflicts } from "./conflict-service";
import { validateGuideForPublication } from "./publication";

export async function validateAdminGuideForPublication(articleId: string) {
  await assertAdmin();
  const supabase = await createClient();
  const [articleResult, metadataResult, sectionsResult, sourceEntitiesResult] =
    await Promise.all([
      supabase
        .from("articles")
        .select("*")
        .eq("id", articleId)
        .eq("content_type", "guide")
        .maybeSingle(),
      supabase
        .from("programmatic_guide_metadata")
        .select("*")
        .eq("article_id", articleId)
        .maybeSingle(),
      supabase
        .from("article_sections")
        .select("block_type,content")
        .eq("article_id", articleId)
        .order("display_order"),
      supabase
        .from("programmatic_guide_source_entities")
        .select("entity_type,entity_key,contribution_role")
        .eq("article_id", articleId),
    ]);

  throwContentDatabaseError(articleResult.error, "load the Guide");
  throwContentDatabaseError(metadataResult.error, "load Guide metadata");
  throwContentDatabaseError(sectionsResult.error, "load Guide sections");
  throwContentDatabaseError(
    sourceEntitiesResult.error,
    "load Guide source entities",
  );

  if (!articleResult.data || !metadataResult.data) {
    throw new ContentServiceError("Guide not found.", "not_found");
  }

  const article = articleResult.data;
  const metadata = metadataResult.data;
  const identitySourceKeys = (sourceEntitiesResult.data ?? [])
    .filter((source) =>
      ["comparison_subject", "target_species"].includes(
        source.contribution_role,
      ),
    )
    .map((source) => `${source.entity_type}:${source.entity_key}`);
  const conflicts = await findGuideSearchConflicts({
    id: article.id,
    title: article.title ?? "",
    slug: article.slug ?? "",
    normalizedSearchIntent: metadata.normalized_search_intent,
    generationKey: metadata.generation_key,
    guideFamily: metadata.guide_family,
    guideType: metadata.guide_type,
    sourceEntityKeys: identitySourceKeys,
  });
  const detectedConflictStatus = conflicts.errors.length
    ? "exact"
    : conflicts.warnings.length
      ? metadata.search_intent_conflict_status === "resolved"
        ? "resolved"
        : "potential"
      : "none";
  const { error: conflictStatusError } = await supabase
    .from("programmatic_guide_metadata")
    .update({ search_intent_conflict_status: detectedConflictStatus })
    .eq("article_id", article.id);
  throwContentDatabaseError(
    conflictStatusError,
    "store the Guide search-intent conflict status",
  );

  const [
    generationKeyResult,
    searchIntentResult,
    slugResult,
    articleCanonicalResult,
    careGuideCanonicalResult,
  ] = await Promise.all([
    supabase
      .from("programmatic_guide_metadata")
      .select("article_id", { count: "exact", head: true })
      .eq("generation_key", metadata.generation_key)
      .neq("article_id", article.id),
    supabase
      .from("programmatic_guide_metadata")
      .select("article_id", { count: "exact", head: true })
      .eq("normalized_search_intent", metadata.normalized_search_intent)
      .neq("article_id", article.id),
    article.slug
      ? supabase
          .from("articles")
          .select("id", { count: "exact", head: true })
          .eq("slug", article.slug)
          .neq("id", article.id)
      : Promise.resolve({ count: 0, error: null }),
    article.canonical_url
      ? supabase
          .from("articles")
          .select("id", { count: "exact", head: true })
          .eq("canonical_url", article.canonical_url)
          .neq("id", article.id)
      : Promise.resolve({ count: 0, error: null }),
    article.canonical_url
      ? supabase
          .from("care_guides")
          .select("id", { count: "exact", head: true })
          .eq("canonical_url", article.canonical_url)
      : Promise.resolve({ count: 0, error: null }),
  ]);

  for (const [result, operation] of [
    [generationKeyResult, "check the Guide generation key"],
    [searchIntentResult, "check the Guide search intent"],
    [slugResult, "check the Guide slug"],
    [articleCanonicalResult, "check Article canonical URLs"],
    [careGuideCanonicalResult, "check Care Guide canonical URLs"],
  ] as const) {
    throwContentDatabaseError(result.error, operation);
  }

  return validateGuideForPublication({
    id: article.id,
    title: article.title,
    slug: article.slug,
    summary: article.summary,
    seoTitle: article.seo_title,
    metaDescription: article.meta_description,
    canonicalUrl: article.canonical_url,
    sections: (sectionsResult.data ?? []).map((section) => ({
      blockType: section.block_type,
      content: section.content,
    })),
    metadata: {
      guideFamily: metadata.guide_family as GuideFamily,
      guideType: metadata.guide_type,
      generationKey: metadata.generation_key,
      generationMetadata: metadata.generation_metadata,
      primarySearchIntent: metadata.primary_search_intent,
      normalizedSearchIntent: metadata.normalized_search_intent,
      searchIntentConflictStatus: detectedConflictStatus,
      sourceDataFingerprint: metadata.source_data_fingerprint,
      generatedContentHash: metadata.generated_content_hash,
      currentContentHash: metadata.current_content_hash,
      manualEditsDetected: metadata.manual_edits_detected,
    },
    generationKeyUnique: (generationKeyResult.count ?? 0) === 0,
    normalizedSearchIntentUnique: (searchIntentResult.count ?? 0) === 0,
    slugUnique: (slugResult.count ?? 0) === 0,
    canonicalUrlUnique:
      (articleCanonicalResult.count ?? 0) === 0 &&
      (careGuideCanonicalResult.count ?? 0) === 0,
    conflictErrors: conflicts.errors,
    conflictWarnings: conflicts.warnings,
  });
}

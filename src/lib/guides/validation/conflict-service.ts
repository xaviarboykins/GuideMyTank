import "server-only";

import { assertAdmin } from "../../auth/admin";
import { throwContentDatabaseError } from "../../content/database";
import { createClient } from "../../supabase/server";

import {
  detectGuideSearchConflicts,
  type SearchConflictCandidate,
  type SearchConflictSubject,
} from "./search-conflicts";

export async function findGuideSearchConflicts(
  subject: SearchConflictSubject,
) {
  await assertAdmin();
  const supabase = await createClient();
  const [guideResult, articleResult, careGuideResult, sourceResult] =
    await Promise.all([
      supabase
        .from("programmatic_guide_metadata")
        .select(
          "article_id,generation_key,normalized_search_intent,guide_family,guide_type,articles(id,title,slug)",
        ),
      supabase
        .from("articles")
        .select("id,title,slug")
        .eq("content_type", "article"),
      supabase
        .from("care_guides")
        .select("id,title,slug,species_id"),
      supabase
        .from("programmatic_guide_source_entities")
        .select("article_id,entity_type,entity_key,contribution_role"),
    ]);

  throwContentDatabaseError(guideResult.error, "load Guide conflict candidates");
  throwContentDatabaseError(
    articleResult.error,
    "load Article conflict candidates",
  );
  throwContentDatabaseError(
    careGuideResult.error,
    "load Care Guide conflict candidates",
  );
  throwContentDatabaseError(
    sourceResult.error,
    "load Guide source identities",
  );

  const sourceKeysByGuide = new Map<string, string[]>();
  for (const source of sourceResult.data ?? []) {
    if (
      !["comparison_subject", "target_species"].includes(
        source.contribution_role,
      )
    ) {
      continue;
    }
    const keys = sourceKeysByGuide.get(source.article_id) ?? [];
    keys.push(`${source.entity_type}:${source.entity_key}`);
    sourceKeysByGuide.set(source.article_id, keys);
  }

  const candidates: SearchConflictCandidate[] = [
    ...(guideResult.data ?? []).map((guide) => ({
      id: guide.article_id,
      contentType: "guide" as const,
      title: guide.articles?.title ?? null,
      slug: guide.articles?.slug ?? null,
      normalizedSearchIntent: guide.normalized_search_intent,
      generationKey: guide.generation_key,
      guideFamily: guide.guide_family,
      guideType: guide.guide_type,
      sourceEntityKeys: sourceKeysByGuide.get(guide.article_id) ?? [],
    })),
    ...(articleResult.data ?? []).map((article) => ({
      id: article.id,
      contentType: "article" as const,
      title: article.title,
      slug: article.slug,
    })),
    ...(careGuideResult.data ?? []).map((guide) => ({
      id: guide.id,
      contentType: "care_guide" as const,
      title: guide.title,
      slug: guide.slug,
      sourceEntityKeys: [`species:${guide.species_id}`],
    })),
  ];

  return detectGuideSearchConflicts(subject, candidates);
}

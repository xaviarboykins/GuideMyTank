import "server-only";

import { assertAdmin } from "@/lib/auth/admin";
import { throwContentDatabaseError } from "@/lib/content/database";
import { ContentServiceError } from "@/lib/content/errors";
import { normalizeContentSlug } from "@/lib/content/slug";
import { validateArticleBlockContent } from "@/lib/content/structured-data";
import { createClient } from "@/lib/supabase/server";
import { createStaticClient } from "@/lib/supabase/static";
import type { Database } from "@/types/database.types";

import { ARTICLE_BLOCK_TYPES, validateArticleForPublication } from "./validation";

type ArticleUpdate = Database["public"]["Tables"]["articles"]["Update"];
type ArticleSectionInsert = Database["public"]["Tables"]["article_sections"]["Insert"];

export async function listPublishedArticles() {
  const supabase = createStaticClient();
  const { data, error } = await supabase
    .from("articles")
    .select("id,title,slug,summary,published_at,featured_image_id,article_images(image_id,display_order,content_images(storage_path,alt_text,caption)),article_category_assignments(category_id,article_categories(name,slug)),article_tag_assignments(tag_id,article_tags(name,slug))")
    .eq("status", "published")
    .order("published_at", { ascending: false });
  throwContentDatabaseError(error, "list published articles");
  return data ?? [];
}

export async function getPublishedArticleBySlug(slug: string) {
  const supabase = createStaticClient();
  const { data: article, error } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", normalizeContentSlug(slug))
    .eq("status", "published")
    .maybeSingle();
  throwContentDatabaseError(error, "load the published article");
  if (!article) return null;
  const [sections, images, sources, categories, tags] = await Promise.all([
    supabase.from("article_sections").select("*").eq("article_id", article.id).order("display_order"),
    supabase.from("article_images").select("*,content_images(*)").eq("article_id", article.id).order("display_order"),
    supabase.from("article_sources").select("*,sources(*)").eq("article_id", article.id).order("display_order"),
    supabase.from("article_category_assignments").select("*,article_categories(*)").eq("article_id", article.id),
    supabase.from("article_tag_assignments").select("*,article_tags(*)").eq("article_id", article.id),
  ]);
  throwContentDatabaseError(sections.error, "load published article sections");
  throwContentDatabaseError(images.error, "load published article images");
  throwContentDatabaseError(sources.error, "load published article sources");
  throwContentDatabaseError(categories.error, "load published article categories");
  throwContentDatabaseError(tags.error, "load published article tags");
  return { article, sections: sections.data ?? [], images: images.data ?? [], sources: sources.data ?? [], categories: categories.data ?? [], tags: tags.data ?? [] };
}

export async function createArticleDraft(title = "Untitled Article") {
  await assertAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.from("articles").insert({ title }).select("*").single();
  throwContentDatabaseError(error, "create the article draft");
  return data;
}

export async function getAdminArticle(id: string) {
  await assertAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.from("articles").select("*").eq("id", id).maybeSingle();
  throwContentDatabaseError(error, "load the article");
  return data;
}

export async function getArticleEditorData(id: string) {
  await assertAdmin();
  const supabase = await createClient();
  const [article, sections, images, sources, categories, tags, allCategories, allTags] = await Promise.all([
    supabase.from("articles").select("*").eq("id", id).maybeSingle(),
    supabase.from("article_sections").select("*").eq("article_id", id).order("display_order"),
    supabase.from("article_images").select("*,content_images(*)").eq("article_id", id).order("display_order"),
    supabase.from("article_sources").select("*,sources(*)").eq("article_id", id).order("display_order"),
    supabase.from("article_category_assignments").select("*,article_categories(*)").eq("article_id", id),
    supabase.from("article_tag_assignments").select("*,article_tags(*)").eq("article_id", id),
    supabase.from("article_categories").select("*").eq("is_active", true).order("name"),
    supabase.from("article_tags").select("*").eq("is_active", true).order("name"),
  ]);
  throwContentDatabaseError(article.error, "load the article");
  throwContentDatabaseError(sections.error, "load article sections");
  throwContentDatabaseError(images.error, "load article images");
  throwContentDatabaseError(sources.error, "load article sources");
  throwContentDatabaseError(categories.error, "load article categories");
  throwContentDatabaseError(tags.error, "load article tags");
  throwContentDatabaseError(allCategories.error, "load category choices");
  throwContentDatabaseError(allTags.error, "load tag choices");
  if (!article.data) return null;
  return { article: article.data, sections: sections.data ?? [], images: images.data ?? [], sources: sources.data ?? [], categories: categories.data ?? [], tags: tags.data ?? [], allCategories: allCategories.data ?? [], allTags: allTags.data ?? [] };
}

export async function listAdminArticles(query = "", status?: string) {
  await assertAdmin();
  const supabase = await createClient();
  let request = supabase.from("articles").select("*").order("updated_at", { ascending: false });
  const normalizedQuery = query.replace(/[%_,().]/g, " ").trim();
  if (normalizedQuery) request = request.or(`title.ilike.%${normalizedQuery}%,slug.ilike.%${normalizedQuery}%`);
  if (status) request = request.eq("status", status);
  const { data, error } = await request;
  throwContentDatabaseError(error, "list articles");
  return data;
}

export async function updateArticleDraft(id: string, update: ArticleUpdate) {
  await assertAdmin();
  const safeUpdate: ArticleUpdate = { ...update };
  delete safeUpdate.id;
  delete safeUpdate.status;
  delete safeUpdate.published_at;
  if (typeof safeUpdate.slug === "string") safeUpdate.slug = normalizeContentSlug(safeUpdate.slug) || null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("articles").update(safeUpdate).eq("id", id).in("status", ["draft", "archived"]).select("*").single();
  throwContentDatabaseError(error, "save the article");
  return data;
}

export async function deleteArticleDraft(id: string) {
  await assertAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.from("articles").delete().eq("id", id).eq("status", "draft").select("id").maybeSingle();
  throwContentDatabaseError(error, "delete the article draft");
  if (!data) throw new ContentServiceError("Only draft articles can be deleted.", "validation");
}

export async function saveArticleSections(id: string, sections: Omit<ArticleSectionInsert, "article_id">[]) {
  await assertAdmin();
  for (const section of sections) {
    if (!ARTICLE_BLOCK_TYPES.includes(section.block_type as (typeof ARTICLE_BLOCK_TYPES)[number])) {
      throw new ContentServiceError("Unknown article block type.", "validation");
    }
    const validation = validateArticleBlockContent(section.block_type, section.content ?? {});
    if (!validation.valid) throw new ContentServiceError(validation.issues[0].message, "validation");
  }
  const supabase = await createClient();
  const rows = sections.map((section) => ({ ...section, article_id: id }));
  const { data, error } = await supabase.from("article_sections").upsert(rows, { onConflict: "article_id,display_order" }).select("*");
  throwContentDatabaseError(error, "save article sections");
  return data;
}

export async function isArticleSlugAvailable(slug: string, excludeId?: string) {
  await assertAdmin();
  const supabase = await createClient();
  let request = supabase.from("articles").select("id").eq("slug", normalizeContentSlug(slug));
  if (excludeId) request = request.neq("id", excludeId);
  const { data, error } = await request.limit(1);
  throwContentDatabaseError(error, "check the article slug");
  return data.length === 0;
}

export async function publishArticle(id: string) {
  await assertAdmin();
  const supabase = await createClient();
  const [articleResult, sectionsResult] = await Promise.all([
    supabase.from("articles").select("*").eq("id", id).maybeSingle(),
    supabase.from("article_sections").select("block_type,content").eq("article_id", id),
  ]);
  throwContentDatabaseError(articleResult.error, "load the article");
  throwContentDatabaseError(sectionsResult.error, "load article sections");
  if (!articleResult.data) throw new ContentServiceError("Article not found.", "not_found");
  const article = articleResult.data;
  const slugAvailable = article.slug ? await isArticleSlugAvailable(article.slug, article.id) : false;
  const validation = validateArticleForPublication({
    title: article.title,
    slug: article.slug,
    summary: article.summary,
    sections: (sectionsResult.data ?? []).map((section) => ({ blockType: section.block_type, content: section.content })),
    slugAvailable,
  });
  if (!validation.valid) return validation;
  const { error } = await supabase.from("articles").update({ status: "published", published_at: new Date().toISOString() }).eq("id", id);
  throwContentDatabaseError(error, "publish the article");
  return validation;
}

export async function archiveArticle(id: string) {
  await assertAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("articles").update({ status: "archived" }).eq("id", id);
  throwContentDatabaseError(error, "archive the article");
}

export async function assignArticleCategory(articleId: string, categoryId: string) {
  await assertAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("article_category_assignments").upsert({ article_id: articleId, category_id: categoryId });
  throwContentDatabaseError(error, "assign the article category");
}

export async function removeArticleCategory(articleId: string, categoryId: string) {
  await assertAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("article_category_assignments").delete().eq("article_id", articleId).eq("category_id", categoryId);
  throwContentDatabaseError(error, "remove the article category");
}

export async function assignArticleTag(articleId: string, tagId: string) {
  await assertAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("article_tag_assignments").upsert({ article_id: articleId, tag_id: tagId });
  throwContentDatabaseError(error, "assign the article tag");
}

export async function removeArticleTag(articleId: string, tagId: string) {
  await assertAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("article_tag_assignments").delete().eq("article_id", articleId).eq("tag_id", tagId);
  throwContentDatabaseError(error, "remove the article tag");
}

export async function addArticleImage(articleId: string, imageId: string, displayOrder: number) {
  await assertAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("article_images").insert({ article_id: articleId, image_id: imageId, display_order: displayOrder });
  throwContentDatabaseError(error, "add the article image");
}

export async function removeArticleImage(articleId: string, imageId: string) {
  await assertAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("article_images").delete().eq("article_id", articleId).eq("image_id", imageId);
  throwContentDatabaseError(error, "remove the article image");
}

export async function setArticleFeaturedImage(articleId: string, imageId: string | null) {
  return updateArticleDraft(articleId, { featured_image_id: imageId, open_graph_image_id: imageId });
}

export async function addArticleSource(articleId: string, sourceId: string, displayOrder: number, citationLabel?: string) {
  await assertAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("article_sources").insert({
    article_id: articleId,
    source_id: sourceId,
    display_order: displayOrder,
    citation_label: citationLabel?.trim() || null,
  });
  throwContentDatabaseError(error, "add the article source");
}

export async function removeArticleSource(articleId: string, sourceId: string) {
  await assertAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("article_sources").delete().eq("article_id", articleId).eq("source_id", sourceId);
  throwContentDatabaseError(error, "remove the article source");
}

export async function addRelatedArticle(articleId: string, relatedArticleId: string, displayOrder: number, relationshipLabel?: string) {
  await assertAdmin();
  if (articleId === relatedArticleId) throw new ContentServiceError("An article cannot relate to itself.", "validation");
  const supabase = await createClient();
  const { error } = await supabase.from("article_related_articles").insert({
    article_id: articleId,
    related_article_id: relatedArticleId,
    display_order: displayOrder,
    relationship_label: relationshipLabel?.trim() || null,
  });
  throwContentDatabaseError(error, "add the related article");
}

export async function addRelatedCareGuide(articleId: string, careGuideId: string, displayOrder: number, relationshipLabel?: string) {
  await assertAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("article_related_care_guides").insert({
    article_id: articleId,
    care_guide_id: careGuideId,
    display_order: displayOrder,
    relationship_label: relationshipLabel?.trim() || null,
  });
  throwContentDatabaseError(error, "add the related Care Guide");
}

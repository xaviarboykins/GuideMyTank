"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  addArticleSource, archiveArticle, assignArticleCategory, assignArticleTag, getAdminArticle, publishArticle,
  removeArticleCategory, removeArticleImage, removeArticleSource, removeArticleTag,
  saveArticleSections, setArticleFeaturedImage, updateArticleDraft,
} from "@/lib/articles/service";
import { ContentServiceError, getSafeContentError } from "@/lib/content/errors";
import { createSource } from "@/lib/content-sources/service";
import type { ValidationIssue } from "@/lib/content/types";
import type { Json } from "@/types/database.types";
import { isProductCategory } from "@/lib/products/types";
import { archiveGuide, publishGuide } from "@/lib/guides/repository";
import { revalidateEditorialContent } from "@/lib/cache/revalidation";

type PublishState = { ok: boolean; message: string; issues: ValidationIssue[] };

function value(formData: FormData, name: string) { const result = String(formData.get(name) ?? "").trim(); return result || null; }
function returnToArticle(id: string, key: "saved" | "error", message: string): never { redirect(`/admin/articles/${id}?${key}=${encodeURIComponent(message)}`); }
async function run(id: string, message: string, operation: () => Promise<unknown>): Promise<never> { try { await operation(); } catch (error) { returnToArticle(id, "error", getSafeContentError(error).message); } returnToArticle(id, "saved", message); }

function parseContent(blockType: string, raw: string): Json {
  const trimmed = raw.trim();
  if (["paragraph", "tip", "warning"].includes(blockType) && !trimmed.startsWith("{")) return { text: trimmed };
  if (blockType === "heading" && !trimmed.startsWith("{")) return { text: trimmed, level: 2 };
  try { return JSON.parse(trimmed) as Json; }
  catch { throw new ContentServiceError("Structured block content must be valid JSON.", "validation"); }
}

export async function saveArticleFieldsAction(id: string, formData: FormData) {
  const includeProducts = formData.get("includeProducts") === "on";
  const selectedCategory = String(formData.get("productCategory") ?? "");
  const productCategory =
    includeProducts && isProductCategory(selectedCategory)
      ? selectedCategory
      : null;

  const previous = await getAdminArticle(id);
  return run(id, "Publishing fields saved.", async () => {
    const updated = await updateArticleDraft(id, { title: value(formData, "title"), slug: value(formData, "slug"), summary: value(formData, "summary"), seo_title: value(formData, "seoTitle"), meta_description: value(formData, "metaDescription"), canonical_url: value(formData, "canonicalUrl"), is_featured: formData.get("isFeatured") === "on", include_products: includeProducts && productCategory !== null, product_category: productCategory });
    if (previous?.slug !== updated.slug) {
      revalidateEditorialContent(previous?.content_type === "guide" ? "guide" : "article", [previous?.slug, updated.slug]);
    }
  });
}

export async function saveArticleSectionsAction(id: string, formData: FormData) {
  const blockTypes = formData.getAll("blockType").map(String);
  const rows = blockTypes.map((blockType, index) => ({ id: String(formData.getAll("sectionId")[index]), block_type: blockType, content: parseContent(blockType, String(formData.getAll("content")[index] ?? "")), display_order: Number(formData.getAll("displayOrder")[index] ?? index) }));
  return run(id, "Article sections saved in the selected order.", () => saveArticleSections(id, rows));
}

export async function addArticleSectionAction(id: string, nextOrder: number, formData: FormData) {
  const blockType = String(formData.get("blockType") ?? "paragraph");
  return run(id, "Article section added.", () => saveArticleSections(id, [{ block_type: blockType, content: parseContent(blockType, String(formData.get("content") ?? "")), display_order: nextOrder }]));
}

export async function assignCategoryAction(id: string, formData: FormData) { return run(id, "Category assigned.", () => assignArticleCategory(id, String(formData.get("categoryId") ?? ""))); }
export async function removeCategoryAction(id: string, formData: FormData) { return run(id, "Category removed.", () => removeArticleCategory(id, String(formData.get("categoryId") ?? ""))); }
export async function assignTagAction(id: string, formData: FormData) { return run(id, "Tag assigned.", () => assignArticleTag(id, String(formData.get("tagId") ?? ""))); }
export async function removeTagAction(id: string, formData: FormData) { return run(id, "Tag removed.", () => removeArticleTag(id, String(formData.get("tagId") ?? ""))); }
export async function setFeaturedImageAction(id: string, formData: FormData) { return run(id, "Featured image updated.", () => setArticleFeaturedImage(id, String(formData.get("imageId") ?? "") || null)); }
export async function removeArticleImageAction(id: string, formData: FormData) { return run(id, "Image removed.", () => removeArticleImage(id, String(formData.get("imageId") ?? ""))); }

export async function addArticleSourceAction(id: string, nextOrder: number, formData: FormData) {
  return run(id, "Source added.", async () => { const source = await createSource({ title: String(formData.get("title") ?? "").trim(), publisher: value(formData, "publisher"), author: value(formData, "author"), url: value(formData, "url"), source_type: String(formData.get("sourceType") ?? "website"), accessed_date: value(formData, "accessedDate") }); await addArticleSource(id, source.id, nextOrder, value(formData, "citationLabel") ?? undefined); });
}
export async function removeArticleSourceAction(id: string, formData: FormData) { return run(id, "Source removed.", () => removeArticleSource(id, String(formData.get("sourceId") ?? ""))); }

export async function publishArticleAction(id: string, state: PublishState): Promise<PublishState> { void state; try { const item = await getAdminArticle(id); const isGuide = item?.content_type === "guide"; const result = isGuide ? await publishGuide(id) : await publishArticle(id); if (!result.valid) return { ok: false, message: `The ${isGuide ? "Guide" : "article"} is not ready to publish.`, issues: "issues" in result ? result.issues : [...result.errors, ...result.warnings] }; revalidatePath(`/admin/articles/${id}`); revalidateEditorialContent(isGuide ? "guide" : "article", [item?.slug]); return { ok: true, message: `${isGuide ? "Guide" : "Article"} published.`, issues: [] }; } catch (error) { return { ok: false, message: getSafeContentError(error).message, issues: [] }; } }
export async function archiveArticleAction(id: string) { const item = await getAdminArticle(id); if (item?.content_type === "guide") await archiveGuide(id); else await archiveArticle(id); revalidatePath(`/admin/articles/${id}`); revalidateEditorialContent(item?.content_type === "guide" ? "guide" : "article", [item?.slug]); }

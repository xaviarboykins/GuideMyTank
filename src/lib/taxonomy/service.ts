import "server-only";

import { assertAdmin } from "@/lib/auth/admin";
import { throwContentDatabaseError } from "@/lib/content/database";
import { normalizeContentSlug } from "@/lib/content/slug";
import { createClient } from "@/lib/supabase/server";
import { ContentServiceError } from "@/lib/content/errors";

type TaxonomyTable = "article_categories" | "article_tags";

async function listTaxonomy(table: TaxonomyTable) {
  await assertAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.from(table).select("*").order("name");
  throwContentDatabaseError(error, `list ${table}`);
  return data;
}

async function createTaxonomy(table: TaxonomyTable, name: string, description?: string) {
  await assertAdmin();
  const supabase = await createClient();
  const normalizedName = name.trim();
  const slug = normalizeContentSlug(normalizedName);
  if (!normalizedName || !slug) throw new ContentServiceError("Enter a valid name.", "validation");
  const { data: conflict } = await supabase.from(table).select("id").or(`name.ilike.${normalizedName},slug.eq.${slug}`).limit(1);
  if (conflict?.length) throw new ContentServiceError("That name or slug is already in use.", "conflict");
  const { data, error } = await supabase
    .from(table)
    .insert({ name: normalizedName, slug, description: description?.trim() || null })
    .select("*")
    .single();
  throwContentDatabaseError(error, `create ${table}`);
  return data;
}

async function updateTaxonomy(table: TaxonomyTable, id: string, name: string, slugValue: string, description?: string, isActive = true) {
  await assertAdmin();
  const normalizedName = name.trim();
  const slug = normalizeContentSlug(slugValue || normalizedName);
  if (!normalizedName || !slug) throw new ContentServiceError("Enter a valid name and slug.", "validation");
  const supabase = await createClient();
  const { data: conflict } = await supabase.from(table).select("id").or(`name.ilike.${normalizedName},slug.eq.${slug}`).neq("id", id).limit(1);
  if (conflict?.length) throw new ContentServiceError("That name or slug is already in use.", "conflict");
  const { data, error } = await supabase.from(table).update({ name: normalizedName, slug, description: description?.trim() || null, is_active: isActive }).eq("id", id).select("*").single();
  throwContentDatabaseError(error, `update ${table}`);
  return data;
}

async function deleteTaxonomy(table: TaxonomyTable, id: string) {
  await assertAdmin();
  const supabase = await createClient();
  const usage = table === "article_categories"
    ? await supabase.from("article_category_assignments").select("article_id", { count: "exact", head: true }).eq("category_id", id)
    : await supabase.from("article_tag_assignments").select("article_id", { count: "exact", head: true }).eq("tag_id", id);
  const { count, error: countError } = usage;
  throwContentDatabaseError(countError, `check ${table} assignments`);
  if (count) throw new ContentServiceError("This item is assigned to an article. Deactivate it instead of deleting it.", "in_use");
  const { error } = await supabase.from(table).delete().eq("id", id);
  throwContentDatabaseError(error, `delete ${table}`);
}

export const listArticleCategories = () => listTaxonomy("article_categories");
export const listArticleTags = () => listTaxonomy("article_tags");
export const createArticleCategory = (name: string, description?: string) => createTaxonomy("article_categories", name, description);
export const createArticleTag = (name: string, description?: string) => createTaxonomy("article_tags", name, description);
export const updateArticleCategory = (id: string, name: string, slug: string, description?: string, isActive = true) => updateTaxonomy("article_categories", id, name, slug, description, isActive);
export const updateArticleTag = (id: string, name: string, slug: string, description?: string, isActive = true) => updateTaxonomy("article_tags", id, name, slug, description, isActive);
export const deleteArticleCategory = (id: string) => deleteTaxonomy("article_categories", id);
export const deleteArticleTag = (id: string) => deleteTaxonomy("article_tags", id);

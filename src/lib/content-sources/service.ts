import "server-only";

import { assertAdmin } from "@/lib/auth/admin";
import { throwContentDatabaseError } from "@/lib/content/database";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import { ContentServiceError } from "@/lib/content/errors";

type SourceInsert = Database["public"]["Tables"]["sources"]["Insert"];
type SourceUpdate = Database["public"]["Tables"]["sources"]["Update"];

export async function createSource(source: SourceInsert) {
  await assertAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.from("sources").insert(source).select("*").single();
  throwContentDatabaseError(error, "create the source");
  return data;
}

export async function updateSource(id: string, source: SourceUpdate) {
  await assertAdmin();
  const safeUpdate = { ...source };
  delete safeUpdate.id;
  const supabase = await createClient();
  const { data, error } = await supabase.from("sources").update(safeUpdate).eq("id", id).select("*").single();
  throwContentDatabaseError(error, "update the source");
  return data;
}

export async function listSources(query = "") {
  await assertAdmin();
  const supabase = await createClient();
  let request = supabase.from("sources").select("*").order("title");
  const normalizedQuery = query.replace(/[%_,().]/g, " ").trim();
  if (normalizedQuery) request = request.or(`title.ilike.%${normalizedQuery}%,publisher.ilike.%${normalizedQuery}%,author.ilike.%${normalizedQuery}%`);
  const { data, error } = await request;
  throwContentDatabaseError(error, "list sources");
  return data;
}

export async function deleteSource(id: string) {
  await assertAdmin();
  const supabase = await createClient();
  const [guides, articles] = await Promise.all([
    supabase.from("care_guide_sources").select("care_guide_id", { count: "exact", head: true }).eq("source_id", id),
    supabase.from("article_sources").select("article_id", { count: "exact", head: true }).eq("source_id", id),
  ]);
  throwContentDatabaseError(guides.error, "check Care Guide source usage");
  throwContentDatabaseError(articles.error, "check article source usage");
  if ((guides.count ?? 0) + (articles.count ?? 0) > 0) throw new ContentServiceError("This source is attached to published or draft content and cannot be deleted.", "in_use");
  const { error } = await supabase.from("sources").delete().eq("id", id);
  throwContentDatabaseError(error, "delete the source");
}

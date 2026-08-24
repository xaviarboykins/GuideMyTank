import "server-only";

import { assertAdmin } from "@/lib/auth/admin";
import { throwContentDatabaseError } from "@/lib/content/database";
import { ContentServiceError } from "@/lib/content/errors";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

const CONTENT_IMAGE_BUCKET = "content-images";

type ContentImageUpdate = Database["public"]["Tables"]["content_images"]["Update"];

export async function updateContentImage(id: string, update: ContentImageUpdate) {
  await assertAdmin();
  const safeUpdate = { ...update };
  delete safeUpdate.id;
  delete safeUpdate.storage_path;
  const supabase = await createClient();
  const { data, error } = await supabase.from("content_images").update(safeUpdate).eq("id", id).select("*").single();
  throwContentDatabaseError(error, "update image metadata");
  return data;
}

export async function listContentImages(speciesId?: string) {
  await assertAdmin();
  const supabase = await createClient();
  let request = supabase.from("content_images").select("*").order("created_at", { ascending: false });
  if (speciesId) request = request.eq("species_id", speciesId);
  const { data, error } = await request;
  throwContentDatabaseError(error, "list content images");
  return data;
}

export async function deleteContentImage(id: string) {
  await assertAdmin();
  const supabase = await createClient();
  const [image, guides, articles, guideOg, articleFeatured, articleOg] = await Promise.all([
    supabase.from("content_images").select("storage_path").eq("id", id).maybeSingle(),
    supabase.from("care_guide_images").select("care_guide_id", { count: "exact", head: true }).eq("image_id", id),
    supabase.from("article_images").select("article_id", { count: "exact", head: true }).eq("image_id", id),
    supabase.from("care_guides").select("id", { count: "exact", head: true }).eq("open_graph_image_id", id),
    supabase.from("articles").select("id", { count: "exact", head: true }).eq("featured_image_id", id),
    supabase.from("articles").select("id", { count: "exact", head: true }).eq("open_graph_image_id", id),
  ]);
  throwContentDatabaseError(image.error, "load the image");
  if (!image.data) throw new ContentServiceError("Image not found.", "not_found");
  const usage = [guides, articles, guideOg, articleFeatured, articleOg].reduce((sum, result) => sum + (result.count ?? 0), 0);
  if (usage) throw new ContentServiceError("This image is used by content and cannot be deleted. Remove its assignments first.", "in_use");
  const { error } = await supabase.from("content_images").delete().eq("id", id);
  throwContentDatabaseError(error, "delete image metadata");
  const { error: storageError } = await supabase.storage.from(CONTENT_IMAGE_BUCKET).remove([image.data.storage_path]);
  if (storageError) throw new ContentServiceError("Image metadata was deleted, but the storage object could not be removed.", "storage");
}

export async function createContentImageSignedUrl(storagePath: string) {
  await assertAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(CONTENT_IMAGE_BUCKET).createSignedUrl(storagePath, 60 * 10);
  if (error) throw new ContentServiceError("The image preview could not be created.", "storage");
  return data.signedUrl;
}

export async function createContentImageSignedUrls(storagePaths: string[]) {
  await assertAdmin();
  if (storagePaths.length === 0) return new Map<string, string>();
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(CONTENT_IMAGE_BUCKET).createSignedUrls(storagePaths, 60 * 10);
  if (error) throw new ContentServiceError("Image previews could not be created.", "storage");
  return new Map(data.map((item, index) => [storagePaths[index], item.signedUrl ?? ""]));
}


import "server-only";

import { assertAdmin } from "@/lib/auth/admin";
import { throwContentDatabaseError } from "@/lib/content/database";
import { ContentServiceError } from "@/lib/content/errors";
import { createClient } from "@/lib/supabase/server";
import { createStaticClient } from "@/lib/supabase/static";
import type { Database } from "@/types/database.types";

const CONTENT_IMAGE_BUCKET = "content-images";
const MAX_CONTENT_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_CONTENT_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);

type ContentImageUpdate = Database["public"]["Tables"]["content_images"]["Update"];

function extensionFor(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension && /^[a-z0-9]+$/.test(extension)) return extension;
  return file.type.split("/")[1] || "image";
}

export async function uploadContentImage(file: File, speciesId: string | null = null) {
  await assertAdmin();
  if (!ALLOWED_CONTENT_IMAGE_TYPES.has(file.type)) throw new ContentServiceError("Choose a JPEG, PNG, WebP, AVIF, or GIF image.", "validation");
  if (file.size <= 0 || file.size > MAX_CONTENT_IMAGE_BYTES) throw new ContentServiceError("Content images must be between 1 byte and 10 MB.", "validation");

  const supabase = await createClient();
  const storagePath = `${speciesId ? `care-guides/${speciesId}` : "articles"}/${crypto.randomUUID()}.${extensionFor(file)}`;
  const { error: uploadError } = await supabase.storage.from(CONTENT_IMAGE_BUCKET).upload(storagePath, file, {
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) throw new ContentServiceError("The image upload failed.", "storage");

  const { data, error } = await supabase
    .from("content_images")
    .insert({ storage_path: storagePath, species_id: speciesId, mime_type: file.type, file_size_bytes: file.size })
    .select("*")
    .single();

  if (error) {
    await supabase.storage.from(CONTENT_IMAGE_BUCKET).remove([storagePath]);
    throwContentDatabaseError(error, "save image metadata");
  }

  return data;
}

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

export async function createPublishedContentImageSignedUrls(storagePaths: string[]) {
  if (storagePaths.length === 0) return new Map<string, string>();
  const supabase = createStaticClient();
  const { data, error } = await supabase.storage.from(CONTENT_IMAGE_BUCKET).createSignedUrls(storagePaths, 60 * 60);
  if (error) throw new ContentServiceError("Published images could not be loaded.", "storage");
  return new Map(data.map((item, index) => [storagePaths[index], item.signedUrl ?? ""]));
}

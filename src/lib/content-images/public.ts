import "server-only";

import { ContentServiceError } from "@/lib/content/errors";
import { createStaticClient } from "@/lib/supabase/static";

const CONTENT_IMAGE_BUCKET = "content-images";

export async function createPublishedContentImageSignedUrls(
  storagePaths: string[],
) {
  return new Map(
    storagePaths.map((storagePath) => [
      storagePath,
      `/media/content/${storagePath
        .split("/")
        .map((segment) => encodeURIComponent(segment))
        .join("/")}`,
    ]),
  );
}

export async function createPublishedContentImageFetchUrl(storagePath: string) {
  const supabase = createStaticClient();
  const { data, error } = await supabase.storage
    .from(CONTENT_IMAGE_BUCKET)
    .createSignedUrl(storagePath, 60);
  if (error) {
    throw new ContentServiceError(
      "Published images could not be loaded.",
      "storage",
    );
  }
  return data.signedUrl;
}

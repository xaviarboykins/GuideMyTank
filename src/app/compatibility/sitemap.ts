import type { MetadataRoute } from "next";

import { getIndexableCompatibilityPairs } from "@/lib/compatibility/service";
import { getCompatibilityUrl } from "@/lib/compatibility/urls";
import {
  COMPATIBILITY_SITEMAP_BATCH_SIZE,
  getSitemapBatchIds,
} from "@/lib/seo/sitemaps";

export const revalidate = 86_400; // CACHE_TTL.sitemap

export async function generateSitemaps() {
  const pairs = await getIndexableCompatibilityPairs();

  return getSitemapBatchIds(pairs.length, COMPATIBILITY_SITEMAP_BATCH_SIZE);
}

export default async function sitemap({
  id,
}: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  const [sitemapId, pairs] = await Promise.all([
    id.then(Number),
    getIndexableCompatibilityPairs(),
  ]);
  const offset = sitemapId * COMPATIBILITY_SITEMAP_BATCH_SIZE;
  const batch = pairs.slice(offset, offset + COMPATIBILITY_SITEMAP_BATCH_SIZE);

  return batch.map((pair) => ({
    url: getCompatibilityUrl(pair.speciesA, pair.speciesB),
  }));
}

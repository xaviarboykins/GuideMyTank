import type { MetadataRoute } from "next";

import {
  generateCanonicalCompatibilityPairBatch,
  getCanonicalCompatibilityPairCount,
  getCompatibilityUrl,
} from "@/lib/compatibility/urls";
import { getSpeciesSlugs } from "@/lib/data/species";
import {
  COMPATIBILITY_SITEMAP_BATCH_SIZE,
  getSitemapBatchIds,
} from "@/lib/seo/sitemaps";

export const revalidate = 86_400; // CACHE_TTL.sitemap

export async function generateSitemaps() {
  const species = await getSpeciesSlugs();

  return getSitemapBatchIds(
    getCanonicalCompatibilityPairCount(species.length),
    COMPATIBILITY_SITEMAP_BATCH_SIZE,
  );
}

export default async function sitemap({
  id,
}: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  const [sitemapId, species] = await Promise.all([
    id.then(Number),
    getSpeciesSlugs(),
  ]);
  const offset = sitemapId * COMPATIBILITY_SITEMAP_BATCH_SIZE;
  const pairs = generateCanonicalCompatibilityPairBatch(
    species,
    offset,
    COMPATIBILITY_SITEMAP_BATCH_SIZE,
  );

  return pairs.map((pair) => ({
    url: getCompatibilityUrl(pair.speciesA, pair.speciesB),
  }));
}

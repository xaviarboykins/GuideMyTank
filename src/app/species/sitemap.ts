import type { MetadataRoute } from "next";

import { getSpeciesSlugs } from "@/lib/data/species";
import { getSiteUrl } from "@/lib/seo/site-url";

export const revalidate = 86_400; // CACHE_TTL.sitemap

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const species = await getSpeciesSlugs();

  return species.map((item) => ({
    url: getSiteUrl(`/species/${item.slug}`),
    ...(item.updated_at ? { lastModified: new Date(item.updated_at) } : {}),
  }));
}

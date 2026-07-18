import type { MetadataRoute } from "next";
import { getCanonicalCompatibilityPairCount } from "@/lib/compatibility/urls";
import { getSpeciesSlugs } from "@/lib/data/species";
import { getSiteUrl } from "@/lib/seo/site-url";
import {
  COMPATIBILITY_SITEMAP_BATCH_SIZE,
  getSitemapBatchIds,
} from "@/lib/seo/sitemaps";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const species = await getSpeciesSlugs();
  const compatibilitySitemaps = getSitemapBatchIds(
    getCanonicalCompatibilityPairCount(species.length),
    COMPATIBILITY_SITEMAP_BATCH_SIZE,
  ).map(({ id }) => getSiteUrl(`/compatibility/sitemap/${id}.xml`));

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/auth", "/api"],
    },
    sitemap: [
      getSiteUrl("/sitemap.xml"),
      getSiteUrl("/species/sitemap.xml"),
      getSiteUrl("/care-guides/sitemap.xml"),
      getSiteUrl("/learning-center/sitemap.xml"),
      ...compatibilitySitemaps,
    ],
  };
}

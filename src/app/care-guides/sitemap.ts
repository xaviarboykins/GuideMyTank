import type { MetadataRoute } from "next";

import { listPublishedCareGuides } from "@/lib/care-guides/service";
import { getSiteUrl } from "@/lib/seo/site-url";

export const revalidate = 86_400; // CACHE_TTL.sitemap

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const guides = await listPublishedCareGuides();

  return guides.map((guide) => ({
    url: getSiteUrl(`/care-guides/${guide.slug}`),
    lastModified: new Date(guide.updated_at),
  }));
}

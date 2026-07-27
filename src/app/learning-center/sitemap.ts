import type { MetadataRoute } from "next";

import { listPublishedArticles } from "@/lib/articles/service";
import { getSiteUrl } from "@/lib/seo/site-url";
import { listPublishedGuides } from "@/lib/guides/repository";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, guides] = await Promise.all([listPublishedArticles(), listPublishedGuides()]);

  return [...articles.map((article) => ({
    url: getSiteUrl(`/learning-center/${article.slug}`),
    lastModified: new Date(article.updated_at),
  })), ...guides.map((guide) => ({
    url: getSiteUrl(`/learning-center/guides/${guide.slug}`),
    lastModified: new Date(guide.updated_at),
  }))];
}

import type { MetadataRoute } from "next";

import { listPublishedArticles } from "@/lib/articles/service";
import { getSiteUrl } from "@/lib/seo/site-url";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await listPublishedArticles();

  return articles.map((article) => ({
    url: getSiteUrl(`/learning-center/${article.slug}`),
    lastModified: new Date(article.updated_at),
  }));
}

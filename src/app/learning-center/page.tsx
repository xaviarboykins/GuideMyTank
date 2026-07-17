/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";

import { PageContainer } from "@/components/site/page-container";
import { PageHeader } from "@/components/site/page-header";
import { Button } from "@/components/ui/button";
import { listPublishedArticles } from "@/lib/articles/service";
import { createPublishedContentImageSignedUrls } from "@/lib/content-images/service";

export const metadata: Metadata = {
  title: "Aquarium Learning Center | GuideMyTank",
  description: "Practical freshwater aquarium articles about fish care, aquarium setup, water quality, equipment, and responsible livestock planning.",
  alternates: { canonical: "https://www.guidemytank.com/learning-center" },
};

export const revalidate = 3600;

export default async function LearningCenterPage() {
  const articles = await listPublishedArticles();
  const featuredImages = articles.map((article) => article.article_images.find((image) => image.image_id === article.featured_image_id) ?? article.article_images[0]).filter(Boolean);
  const imageUrls = await createPublishedContentImageSignedUrls(featuredImages.map((image) => image.content_images.storage_path));

  return <PageContainer>
    <PageHeader eyebrow="Aquarium Education" title="Learning Center" description="Practical freshwater aquarium articles covering fish care, aquarium planning, equipment, and responsible livestock choices." />
    <div className="mt-6">
      <Button variant="outline" asChild>
        <Link href="/care-guides">Browse Care Guides</Link>
      </Button>
    </div>
    <section className="mt-8" aria-labelledby="published-articles">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div><h2 id="published-articles" className="text-2xl font-semibold">Latest articles</h2><p className="mt-1 text-sm text-muted-foreground">{articles.length} published {articles.length === 1 ? "article" : "articles"}</p></div>
      </div>
      {articles.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{articles.map((article) => {
        const image = article.article_images.find((item) => item.image_id === article.featured_image_id) ?? article.article_images[0];
        const imageUrl = image ? imageUrls.get(image.content_images.storage_path) : undefined;
        return <article key={article.id} className="overflow-hidden border border-border bg-card">
          <Link href={`/learning-center/${article.slug}`} className="group flex h-full flex-col">
            {imageUrl ? <img src={imageUrl} alt={image?.content_images.alt_text ?? article.title ?? "Aquarium article"} className="aspect-[16/9] w-full object-cover" /> : null}
            <div className="flex flex-1 flex-col p-5">
              <div className="flex flex-wrap gap-2 text-xs uppercase text-muted-foreground">{article.article_category_assignments.map((item) => <span key={item.category_id}>{item.article_categories.name}</span>)}</div>
              <h3 className="mt-2 text-xl font-semibold group-hover:underline">{article.title}</h3>
              {article.summary ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{article.summary}</p> : null}
              {article.published_at ? <time className="mt-auto pt-5 text-xs text-muted-foreground" dateTime={article.published_at}>{new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(article.published_at))}</time> : null}
            </div>
          </Link>
        </article>;
      })}</div> : <div className="border border-border bg-card p-8"><h3 className="font-semibold">No published articles yet</h3><p className="mt-2 text-muted-foreground">Published aquarium education articles will appear here.</p></div>}
    </section>
  </PageContainer>;
}

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

import { PageContainer } from "@/components/site/page-container";
import { PageHeader } from "@/components/site/page-header";
import { ContentBreadcrumbs } from "@/components/content/public-content";
import { JsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { GuideCard } from "@/components/guides/guide-card";
import { listPublishedArticles } from "@/lib/articles/service";
import { createPublishedContentImageSignedUrls } from "@/lib/content-images/public";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { listPublishedGuides } from "@/lib/guides/repository";
import { buildCollectionPageEntities } from "@/lib/seo/schema/collection-page";

const LEARNING_CENTER_PATH = "/learning-center";
const LEARNING_CENTER_TITLE = "Learning Center";
const LEARNING_CENTER_DESCRIPTION =
  "Practical freshwater aquarium articles covering fish care, aquarium planning, equipment, and responsible livestock choices.";

const pageMetadata = buildPageMetadata({
  title: "Aquarium Learning Center",
  description: "Practical freshwater aquarium articles about fish care, aquarium setup, water quality, equipment, and responsible livestock planning.",
  path: LEARNING_CENTER_PATH,
});

export const revalidate = 21_600; // CACHE_TTL.learningCenter

export const metadata = pageMetadata;

export default async function LearningCenterPage() {
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: LEARNING_CENTER_TITLE, path: LEARNING_CENTER_PATH },
  ];
  const schemaEntities = buildCollectionPageEntities({
    path: LEARNING_CENTER_PATH,
    name: LEARNING_CENTER_TITLE,
    description: LEARNING_CENTER_DESCRIPTION,
    breadcrumbs,
  });
  const [allArticles, allGuides] = await Promise.all([listPublishedArticles(), listPublishedGuides()]);
  const articles = allArticles.slice(0, 6);
  const featuredImages = articles.map((article) => article.article_images.find((image) => image.image_id === article.featured_image_id) ?? article.article_images[0]).filter(Boolean);
  const firstGuideImages = allGuides.map((guide) => guide.article_images.toSorted((a, b) => a.display_order - b.display_order)[0]).filter(Boolean);
  const imageUrls = await createPublishedContentImageSignedUrls([...featuredImages, ...firstGuideImages].map((image) => image.content_images.storage_path));
  const guideCard = (guide: (typeof allGuides)[number]) => {
    const image = guide.article_images.toSorted((a, b) => a.display_order - b.display_order)[0];
    return <GuideCard key={guide.id} guide={guide} imageUrl={image ? imageUrls.get(image.content_images.storage_path) : undefined} imageAlt={image?.content_images.alt_text} />;
  };

  return <PageContainer>
    <JsonLd entities={schemaEntities} />
    <ContentBreadcrumbs items={breadcrumbs} />
    <PageHeader eyebrow="Aquarium Education" title={LEARNING_CENTER_TITLE} description={LEARNING_CENTER_DESCRIPTION} />
    <div className="mt-6">
      <div className="flex flex-wrap gap-2"><Button asChild><Link href="/learning-center/articles">Browse Articles</Link></Button><Button variant="outline" asChild><Link href="/learning-center/guides">Browse Guides</Link></Button><Button variant="outline" asChild><Link href="/care-guides">Browse Care Guides</Link></Button></div>
    </div>
    <section className="mt-8" aria-labelledby="published-articles">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div><h2 id="published-articles" className="text-2xl font-semibold">Latest articles</h2><p className="mt-1 text-sm text-muted-foreground">Recently published aquarium education.</p></div>
      </div>
      {articles.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{articles.map((article) => {
        const image = article.article_images.find((item) => item.image_id === article.featured_image_id) ?? article.article_images[0];
        const imageUrl = image ? imageUrls.get(image.content_images.storage_path) : undefined;
        return <article key={article.id} className="overflow-hidden border border-border bg-card">
          <Link href={`/learning-center/${article.slug}`} className="group flex h-full flex-col">
            {imageUrl ? <img src={imageUrl} alt={image?.content_images.alt_text ?? article.title ?? "Aquarium article"} className="aspect-[16/9] w-full object-cover" loading="lazy" /> : null}
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
    {allGuides.some((guide) => guide.is_featured) ? <section className="mt-10 border-t border-border pt-8" aria-labelledby="featured-guides"><div className="mb-4 flex items-end justify-between"><div><h2 id="featured-guides" className="text-2xl font-semibold">Featured Guides</h2><p className="mt-1 text-sm text-muted-foreground">Selected data-backed aquarium planning resources.</p></div><Button asChild variant="outline"><Link href="/learning-center/guides">Browse all Guides</Link></Button></div><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{allGuides.filter((guide) => guide.is_featured).slice(0, 3).map(guideCard)}</div></section> : null}
    {allGuides.length ? <section className={allGuides.some((guide) => guide.is_featured) ? "mt-8" : "mt-10 border-t border-border pt-8"} aria-labelledby="latest-guides"><div className="mb-4 flex items-end justify-between"><div><h2 id="latest-guides" className="text-2xl font-semibold">Latest Guides</h2><p className="mt-1 text-sm text-muted-foreground">Recently published comparisons and planning Guides.</p></div></div><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{allGuides.slice(0, 6).map(guideCard)}</div></section> : null}
  </PageContainer>;
}

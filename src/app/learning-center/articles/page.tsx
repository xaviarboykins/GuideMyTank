/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";

import { PageContainer } from "@/components/site/page-container";
import { PageHeader } from "@/components/site/page-header";
import { ContentBreadcrumbs } from "@/components/content/public-content";
import { JsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listPublishedArticles } from "@/lib/articles/service";
import { createPublishedContentImageSignedUrls } from "@/lib/content-images/service";
import { getSearchVariantRobots, hasActiveSearchParams } from "@/lib/seo/indexability";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { buildCollectionPageEntities } from "@/lib/seo/schema/collection-page";

const PAGE_SIZE = 12;
const ARTICLES_PATH = "/learning-center/articles";
const ARTICLES_TITLE = "Aquarium Articles";
const ARTICLES_DESCRIPTION =
  "Editorial education about freshwater aquarium care, setup, equipment, and responsible livestock planning.";
type Props = { searchParams: Promise<{ q?: string; category?: string; page?: string }> };
const baseMetadata = buildPageMetadata({ title: ARTICLES_TITLE, description: "Browse practical freshwater aquarium articles covering care, setup, water quality, equipment, and responsible livestock planning.", path: ARTICLES_PATH });

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return { ...baseMetadata, robots: getSearchVariantRobots(await searchParams) };
}

export default async function ArticlesIndexPage({ searchParams }: Props) {
  const filters = await searchParams;
  const allArticles = await listPublishedArticles();
  const query = filters.q?.trim().toLowerCase() ?? "";
  const category = filters.category ?? "";
  const categories = [...new Map(allArticles.flatMap((article) => article.article_category_assignments.map((item) => [item.article_categories.slug, item.article_categories.name] as const))).entries()].sort((a, b) => a[1].localeCompare(b[1]));
  const filtered = allArticles.filter((article) => (!query || article.title?.toLowerCase().includes(query) || article.summary?.toLowerCase().includes(query)) && (!category || article.article_category_assignments.some((item) => item.article_categories.slug === category)));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const requestedPage = Number.parseInt(filters.page ?? "1", 10);
  const page = Number.isFinite(requestedPage) ? Math.min(Math.max(requestedPage, 1), totalPages) : 1;
  const articles = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const images = articles.map((article) => article.article_images.find((image) => image.image_id === article.featured_image_id) ?? article.article_images[0]).filter(Boolean);
  const imageUrls = await createPublishedContentImageSignedUrls(images.map((image) => image.content_images.storage_path));
  const pageHref = (target: number) => { const params = new URLSearchParams(); if (filters.q) params.set("q", filters.q); if (category) params.set("category", category); params.set("page", String(target)); return `/learning-center/articles?${params}`; };
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Learning Center", path: "/learning-center" },
    { name: "Articles", path: ARTICLES_PATH },
  ];
  const schemaEntities = hasActiveSearchParams(filters)
    ? null
    : buildCollectionPageEntities({
        path: ARTICLES_PATH,
        name: ARTICLES_TITLE,
        description: ARTICLES_DESCRIPTION,
        breadcrumbs,
        visibleItems: articles.map((article) => ({
          name: article.title,
          path: `/learning-center/${article.slug}`,
        })),
      });

  return <PageContainer>
    <JsonLd entities={schemaEntities} />
    <ContentBreadcrumbs items={breadcrumbs} />
    <PageHeader eyebrow="Learning Center" title={ARTICLES_TITLE} description={ARTICLES_DESCRIPTION} />
    <form action="/learning-center/articles" role="search" className="mt-6 grid gap-3 border border-border bg-card p-4 sm:grid-cols-[1fr_14rem_auto]">
      <label className="space-y-1"><span className="text-sm font-medium">Search Articles</span><Input name="q" defaultValue={filters.q} placeholder="Search titles and summaries" /></label>
      <label className="space-y-1"><span className="text-sm font-medium">Category</span><select name="category" defaultValue={category} className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"><option value="">All categories</option>{categories.map(([slug, name]) => <option key={slug} value={slug}>{name}</option>)}</select></label>
      <div className="flex items-end gap-2"><Button>Filter</Button><Button asChild variant="outline"><Link href="/learning-center/articles">Clear</Link></Button></div>
    </form>
    <div className="mt-8 flex items-end justify-between"><div><h2 className="text-2xl font-semibold">Browse Articles</h2><p className="mt-1 text-sm text-muted-foreground">{filtered.length} published {filtered.length === 1 ? "article" : "articles"}</p></div><p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p></div>
    {articles.length ? <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{articles.map((article) => { const image = article.article_images.find((item) => item.image_id === article.featured_image_id) ?? article.article_images[0]; const imageUrl = image ? imageUrls.get(image.content_images.storage_path) : undefined; return <article key={article.id} className="overflow-hidden border border-border bg-card"><Link href={`/learning-center/${article.slug}`} className="group flex h-full flex-col">{imageUrl ? <img src={imageUrl} alt={image?.content_images.alt_text ?? article.title ?? "Aquarium article"} className="aspect-[16/9] w-full object-cover" loading="lazy" /> : null}<div className="flex flex-1 flex-col p-5"><div className="flex flex-wrap gap-2 text-xs uppercase text-muted-foreground">{article.article_category_assignments.map((item) => <span key={item.category_id}>{item.article_categories.name}</span>)}</div><h3 className="mt-2 text-xl font-semibold group-hover:underline">{article.title}</h3>{article.summary ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{article.summary}</p> : null}{article.published_at ? <time className="mt-auto pt-5 text-xs text-muted-foreground" dateTime={article.published_at}>{new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(article.published_at))}</time> : null}</div></Link></article>; })}</div> : <div className="mt-4 border border-border bg-card p-8"><h3 className="font-semibold">No Articles match these filters</h3><p className="mt-2 text-muted-foreground">Try another search or clear the filters.</p></div>}
    {totalPages > 1 ? <nav aria-label="Article pagination" className="mt-6 flex justify-between"><Button asChild variant="outline"><Link href={pageHref(Math.max(1, page - 1))}>Previous</Link></Button><Button asChild variant="outline"><Link href={pageHref(Math.min(totalPages, page + 1))}>Next</Link></Button></nav> : null}
  </PageContainer>;
}

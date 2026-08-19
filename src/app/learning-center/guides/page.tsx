import type { Metadata } from "next";
import Link from "next/link";

import { GuideCard } from "@/components/guides/guide-card";
import { ContentBreadcrumbs } from "@/components/content/public-content";
import { JsonLd } from "@/components/seo/json-ld";
import { PageContainer } from "@/components/site/page-container";
import { PageHeader } from "@/components/site/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createPublishedContentImageSignedUrls } from "@/lib/content-images/public";
import { listPublishedGuides } from "@/lib/guides/repository";
import { getSearchVariantRobots, hasActiveSearchParams } from "@/lib/seo/indexability";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { buildCollectionPageEntities } from "@/lib/seo/schema/collection-page";

const PAGE_SIZE = 12;
const GUIDES_PATH = "/learning-center/guides";
const GUIDES_TITLE = "Aquarium Guides";
const GUIDES_DESCRIPTION =
  "Data-backed comparisons, tank-mate recommendations, and aquarium planning resources.";
type Props = { searchParams: Promise<{ q?: string; category?: string; family?: string; page?: string }> };
const baseMetadata = buildPageMetadata({ title: GUIDES_TITLE, description: "Browse structured aquarium comparisons, tank-mate recommendations, and tank-size planning Guides.", path: GUIDES_PATH });

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return { ...baseMetadata, robots: getSearchVariantRobots(await searchParams) };
}

export default async function GuidesIndexPage({ searchParams }: Props) {
  const filters = await searchParams;
  const allGuides = await listPublishedGuides();
  const query = filters.q?.trim().toLowerCase() ?? "";
  const category = filters.category ?? "";
  const family = filters.family ?? "";
  const categories = [...new Map(allGuides.flatMap((guide) => guide.article_category_assignments.map((item) => [item.article_categories.slug, item.article_categories.name] as const))).entries()].sort((a, b) => a[1].localeCompare(b[1]));
  const filtered = allGuides.filter((guide) => (!query || guide.title?.toLowerCase().includes(query) || guide.summary?.toLowerCase().includes(query)) && (!category || guide.article_category_assignments.some((item) => item.article_categories.slug === category)) && (!family || guide.programmatic_guide_metadata?.guide_family === family));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const requestedPage = Number.parseInt(filters.page ?? "1", 10);
  const page = Number.isFinite(requestedPage) ? Math.min(Math.max(requestedPage, 1), totalPages) : 1;
  const guides = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const featuredImages = guides.map((guide) => guide.article_images.toSorted((a, b) => a.display_order - b.display_order)[0]).filter(Boolean);
  const imageUrls = await createPublishedContentImageSignedUrls(featuredImages.map((image) => image.content_images.storage_path));
  const pageHref = (target: number) => { const params = new URLSearchParams(); if (filters.q) params.set("q", filters.q); if (category) params.set("category", category); if (family) params.set("family", family); params.set("page", String(target)); return `/learning-center/guides?${params}`; };
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Learning Center", path: "/learning-center" },
    { name: "Guides", path: GUIDES_PATH },
  ];
  const schemaEntities = hasActiveSearchParams(filters)
    ? null
    : buildCollectionPageEntities({
        path: GUIDES_PATH,
        name: GUIDES_TITLE,
        description: GUIDES_DESCRIPTION,
        breadcrumbs,
        visibleItems: guides.map((guide) => ({
          name: guide.title,
          path: `/learning-center/guides/${guide.slug}`,
        })),
      });

  return <PageContainer>
    <JsonLd entities={schemaEntities} />
    <ContentBreadcrumbs items={breadcrumbs} />
    <PageHeader eyebrow="Learning Center" title={GUIDES_TITLE} description={GUIDES_DESCRIPTION} />
    <form action="/learning-center/guides" role="search" className="mt-6 grid gap-3 border border-border bg-card p-4 md:grid-cols-[1fr_13rem_13rem_auto]">
      <label className="space-y-1"><span className="text-sm font-medium">Search Guides</span><Input name="q" defaultValue={filters.q} placeholder="Search titles and summaries" /></label>
      <label className="space-y-1"><span className="text-sm font-medium">Category</span><select name="category" defaultValue={category} className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"><option value="">All categories</option>{categories.map(([slug, name]) => <option key={slug} value={slug}>{name}</option>)}</select></label>
      <label className="space-y-1"><span className="text-sm font-medium">Guide type</span><select name="family" defaultValue={family} className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"><option value="">All types</option><option value="species_comparison">Comparisons</option><option value="tank_mates">Tank mates</option><option value="tank_size">Tank size</option></select></label>
      <div className="flex items-end gap-2"><Button>Filter</Button><Button asChild variant="outline"><Link href="/learning-center/guides">Clear</Link></Button></div>
    </form>
    <div className="mt-8 flex items-end justify-between"><div><h2 className="text-2xl font-semibold">Browse Guides</h2><p className="mt-1 text-sm text-muted-foreground">{filtered.length} published {filtered.length === 1 ? "Guide" : "Guides"}</p></div><p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p></div>
    {guides.length ? <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{guides.map((guide) => { const image = guide.article_images.toSorted((a, b) => a.display_order - b.display_order)[0]; return <GuideCard key={guide.id} guide={guide} imageUrl={image ? imageUrls.get(image.content_images.storage_path) : undefined} imageAlt={image?.content_images.alt_text} />; })}</div> : <div className="mt-4 border border-border bg-card p-8"><h3 className="font-semibold">No Guides match these filters</h3><p className="mt-2 text-muted-foreground">Try another search or clear the filters.</p></div>}
    {totalPages > 1 ? <nav aria-label="Guide pagination" className="mt-6 flex justify-between"><Button asChild variant="outline" aria-disabled={page === 1}><Link href={pageHref(Math.max(1, page - 1))}>Previous</Link></Button><Button asChild variant="outline" aria-disabled={page === totalPages}><Link href={pageHref(Math.min(totalPages, page + 1))}>Next</Link></Button></nav> : null}
  </PageContainer>;
}

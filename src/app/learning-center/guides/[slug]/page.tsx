import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { ArticleBlock } from "@/components/articles/article-block";
import { ArticleImageFlipbook } from "@/components/articles/article-image-grid";
import { ContentBreadcrumbs, ContentByline, ShareLinks, SourcesList } from "@/components/content/public-content";
import { BuilderCallToAction } from "@/components/internal-linking/builder-call-to-action";
import { InternalLinksSection } from "@/components/internal-linking/internal-links-section";
import { JsonLd } from "@/components/seo/json-ld";
import { PageContainer } from "@/components/site/page-container";
import { createPublishedContentImageSignedUrls } from "@/lib/content-images/service";
import { isJsonRecord } from "@/lib/content/structured-data";
import { getPublishedGuideBySlug } from "@/lib/guides/repository";
import { NOINDEX_NOFOLLOW } from "@/lib/seo/indexability";
import { getArticlePageLinks } from "@/lib/seo/internal-linking/service";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { buildArticlePageEntities } from "@/lib/seo/schema/article-page";
import { getSiteUrl } from "@/lib/seo/site-url";

type Props = { params: Promise<{ slug: string }> };
const path = (slug: string) => `/learning-center/guides/${slug}`;
const getCachedPublishedGuideBySlug = cache(getPublishedGuideBySlug);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await getCachedPublishedGuideBySlug(slug);
  if (!result) return buildPageMetadata({ title: "Guide Not Found", description: "The requested aquarium Guide could not be found.", path: path(slug), robots: NOINDEX_NOFOLLOW });
  return buildPageMetadata({ title: result.article.seo_title ?? result.article.title ?? "Aquarium Guide", description: result.article.meta_description ?? result.article.summary ?? "Practical freshwater aquarium guidance from GuideMyTank.", path: path(result.article.slug!), type: "article", publishedTime: result.article.published_at, modifiedTime: result.article.updated_at, publisher: "GuideMyTank" });
}

export const revalidate = 604_800; // CACHE_TTL.careGuides
export const dynamic = "force-static";

export function generateStaticParams() {
  return [];
}

export default async function PublishedGuidePage({ params }: Props) {
  const { slug } = await params;
  const result = await getCachedPublishedGuideBySlug(slug);
  if (!result) notFound();
  const { article, sections, images, sources, categories, tags } = result;
  const internalLinks = await getArticlePageLinks(result);
  const signed = await createPublishedContentImageSignedUrls(images.map((item) => item.content_images.storage_path));
  const imageUrls = new Map(images.map((item) => [item.image_id, signed.get(item.content_images.storage_path) ?? ""]));
  const galleryImages = images.map((item) => ({ id: item.image_id, url: imageUrls.get(item.image_id) ?? "", alt: item.content_images.alt_text ?? "Guide image", caption: item.content_images.caption, attribution: item.content_images.attribution, sourceUrl: item.content_images.source_url, licenseName: item.content_images.license_name, licenseUrl: item.content_images.license_url }));
  const guidePath = path(article.slug!);
  const canonical = getSiteUrl(guidePath);
  const breadcrumbs = [{ name: "Home", path: "/" }, { name: "Learning Center", path: "/learning-center" }, { name: "Guides", path: "/learning-center/guides" }, { name: article.title ?? "Guide", path: guidePath }];
  const visibleFaqs = sections.flatMap((section) => { const items = isJsonRecord(section.content) ? section.content.items : null; return section.block_type === "faq_group" && Array.isArray(items) ? items.filter(isJsonRecord).map((item) => ({ question: typeof item.question === "string" ? item.question : null, answer: typeof item.answer === "string" ? item.answer : null })) : []; });
  const schemaEntities = buildArticlePageEntities({
    path: guidePath,
    headline: article.title,
    description: article.summary,
    datePublished: article.published_at,
    dateModified: article.updated_at,
    articleSection: categories[0]?.article_categories.name,
    keywords: tags.map((item) => item.article_tags.name),
    breadcrumbs,
    visibleFaqs,
  });

  return <PageContainer><article className="mx-auto max-w-4xl">
    <JsonLd entities={schemaEntities} />
    <ContentBreadcrumbs items={breadcrumbs} />
    <header><div className="flex flex-wrap gap-2 text-xs uppercase text-muted-foreground">{categories.map((item) => <span key={item.category_id}>{item.article_categories.name}</span>)}</div><h1 className="mt-2 text-4xl font-bold tracking-tight">{article.title}</h1>{article.summary ? <p className="mt-4 text-lg leading-8 text-muted-foreground">{article.summary}</p> : null}<ContentByline publishedAt={article.published_at} updatedAt={article.updated_at} /><div className="mt-3 flex flex-wrap gap-2">{tags.map((item) => <span key={item.tag_id} className="border border-border px-2 py-1 text-xs">{item.article_tags.name}</span>)}</div></header>
    {galleryImages.length ? <div className="my-8"><ArticleImageFlipbook images={galleryImages} /></div> : null}
    <div className="mt-10 space-y-8">{sections.map((section) => <section id={`section-${section.id}`} key={section.id} className="scroll-mt-24"><ArticleBlock type={section.block_type} content={section.content} imageUrls={imageUrls} /></section>)}</div>
    <SourcesList sources={sources} />
    <InternalLinksSection title="Relevant Species" items={internalLinks.species} limit={4} />
    <InternalLinksSection title="Related Care Guides" items={internalLinks.careGuides} limit={4} />
    <InternalLinksSection title="Compatibility Research" items={internalLinks.compatibilityReports} limit={4} />
    <InternalLinksSection title="Related Learning Center Content" items={internalLinks.relatedArticles} limit={4} />
    <BuilderCallToAction item={internalLinks.builder[0]} />
    <InternalLinksSection title="Product Resources" items={internalLinks.productCategories} limit={1} />
    <ShareLinks title={article.title ?? "GuideMyTank Guide"} url={canonical} />
  </article></PageContainer>;
}

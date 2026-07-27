import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArticleBlock } from "@/components/articles/article-block";
import { ArticleImageFlipbook } from "@/components/articles/article-image-grid";
import { AdvertisementSlot, ContentBreadcrumbs, ContentByline, JsonLd, ShareLinks, SourcesList } from "@/components/content/public-content";
import { BuilderCallToAction } from "@/components/internal-linking/builder-call-to-action";
import { InternalLinksSection } from "@/components/internal-linking/internal-links-section";
import { PageContainer } from "@/components/site/page-container";
import { createPublishedContentImageSignedUrls } from "@/lib/content-images/service";
import { isJsonRecord } from "@/lib/content/structured-data";
import { getPublishedGuideBySlug } from "@/lib/guides/repository";
import { NOINDEX_NOFOLLOW } from "@/lib/seo/indexability";
import { getArticlePageLinks } from "@/lib/seo/internal-linking/service";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getSiteUrl } from "@/lib/seo/site-url";

type Props = { params: Promise<{ slug: string }> };
const path = (slug: string) => `/learning-center/guides/${slug}`;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPublishedGuideBySlug(slug);
  if (!result) return buildPageMetadata({ title: "Guide Not Found", description: "The requested aquarium Guide could not be found.", path: path(slug), robots: NOINDEX_NOFOLLOW });
  return buildPageMetadata({ title: result.article.seo_title ?? result.article.title ?? "Aquarium Guide", description: result.article.meta_description ?? result.article.summary ?? "Practical freshwater aquarium guidance from GuideMyTank.", path: path(result.article.slug!), type: "article", publishedTime: result.article.published_at, modifiedTime: result.article.updated_at });
}

export const revalidate = 3600;

export default async function PublishedGuidePage({ params }: Props) {
  const { slug } = await params;
  const result = await getPublishedGuideBySlug(slug);
  if (!result) notFound();
  const { article, sections, images, sources, categories, tags } = result;
  const internalLinks = await getArticlePageLinks(result);
  const signed = await createPublishedContentImageSignedUrls(images.map((item) => item.content_images.storage_path));
  const imageUrls = new Map(images.map((item) => [item.image_id, signed.get(item.content_images.storage_path) ?? ""]));
  const galleryImages = images.map((item) => ({ id: item.image_id, url: imageUrls.get(item.image_id) ?? "", alt: item.content_images.alt_text ?? "Guide image", caption: item.content_images.caption, attribution: item.content_images.attribution, sourceUrl: item.content_images.source_url, licenseName: item.content_images.license_name, licenseUrl: item.content_images.license_url }));
  const canonical = getSiteUrl(path(article.slug!));
  const faqItems = sections.flatMap((section) => { const items = isJsonRecord(section.content) ? section.content.items : null; return section.block_type === "faq_group" && Array.isArray(items) ? items.filter(isJsonRecord).map((item) => ({ "@type": "Question", name: typeof item.question === "string" ? item.question : "", acceptedAnswer: { "@type": "Answer", text: typeof item.answer === "string" ? item.answer : "" } })) : []; });
  const structuredData: Array<Record<string, unknown>> = [
    { "@context": "https://schema.org", "@type": "Article", headline: article.title, description: article.summary, datePublished: article.published_at, dateModified: article.updated_at, author: { "@type": "Organization", name: "GuideMyTank" }, mainEntityOfPage: canonical },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: getSiteUrl() }, { "@type": "ListItem", position: 2, name: "Learning Center", item: getSiteUrl("/learning-center") }, { "@type": "ListItem", position: 3, name: "Guides", item: getSiteUrl("/learning-center/guides") }, { "@type": "ListItem", position: 4, name: article.title, item: canonical }] },
  ];
  if (faqItems.length) structuredData.push({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqItems });

  return <PageContainer><article className="mx-auto max-w-4xl">
    <JsonLd data={structuredData} />
    <ContentBreadcrumbs items={[{ label: "Home", href: "/" }, { label: "Learning Center", href: "/learning-center" }, { label: "Guides", href: "/learning-center/guides" }, { label: article.title ?? "Guide" }]} />
    <header><div className="flex flex-wrap gap-2 text-xs uppercase text-muted-foreground">{categories.map((item) => <span key={item.category_id}>{item.article_categories.name}</span>)}</div><h1 className="mt-2 text-4xl font-bold tracking-tight">{article.title}</h1>{article.summary ? <p className="mt-4 text-lg leading-8 text-muted-foreground">{article.summary}</p> : null}<ContentByline publishedAt={article.published_at} updatedAt={article.updated_at} /><div className="mt-3 flex flex-wrap gap-2">{tags.map((item) => <span key={item.tag_id} className="border border-border px-2 py-1 text-xs">{item.article_tags.name}</span>)}</div></header>
    {galleryImages.length ? <div className="my-8"><ArticleImageFlipbook images={galleryImages} /></div> : null}
    <AdvertisementSlot name="content-top" />
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

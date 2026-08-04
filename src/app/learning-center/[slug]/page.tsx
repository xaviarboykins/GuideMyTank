/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { ArticleImageFlipbook } from "@/components/articles/article-image-grid";
import { ContentBreadcrumbs, ContentByline, ShareLinks, SourcesList } from "@/components/content/public-content";
import { BuilderCallToAction } from "@/components/internal-linking/builder-call-to-action";
import { InternalLinksSection } from "@/components/internal-linking/internal-links-section";
import { JsonLd } from "@/components/seo/json-ld";
import { PageContainer } from "@/components/site/page-container";
import { getPublishedArticleBySlug } from "@/lib/articles/service";
import { createPublishedContentImageSignedUrls } from "@/lib/content-images/service";
import { isJsonRecord } from "@/lib/content/structured-data";
import { getSiteUrl } from "@/lib/seo/site-url";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { NOINDEX_NOFOLLOW } from "@/lib/seo/indexability";
import { getArticlePageLinks } from "@/lib/seo/internal-linking/service";
import { buildArticlePageEntities } from "@/lib/seo/schema/article-page";
import type { Json } from "@/types/database.types";

type Props = { params: Promise<{ slug: string }> };
const getCachedPublishedArticleBySlug = cache(getPublishedArticleBySlug);

function text(content: Json) { return isJsonRecord(content) && typeof content.text === "string" ? content.text : ""; }

function Block({ type, content, imageUrls }: { type: string; content: Json; imageUrls: Map<string, string> }) {
  const record = isJsonRecord(content) ? content : {};
  if (type === "heading") { const level = Number(record.level); return level === 3 ? <h3 className="text-xl font-semibold">{text(content)}</h3> : level === 4 ? <h4 className="text-lg font-semibold">{text(content)}</h4> : <h2 className="text-2xl font-semibold">{text(content)}</h2>; }
  if (["paragraph", "tip", "warning"].includes(type)) return <div className={type === "paragraph" ? "" : `border p-4 ${type === "warning" ? "border-destructive/40 bg-destructive/10" : "border-blue-700/30 bg-blue-500/10"}`}><p className="whitespace-pre-wrap leading-7">{text(content)}</p></div>;
  if (type === "list" && Array.isArray(record.items)) { const Tag = record.ordered ? "ol" : "ul"; return <Tag className={`${record.ordered ? "list-decimal" : "list-disc"} space-y-2 pl-6`}>{record.items.map((item, index) => <li key={index}>{typeof item === "string" ? item : ""}</li>)}</Tag>; }
  if (type === "comparison_table" && Array.isArray(record.headers) && Array.isArray(record.rows)) return <div className="overflow-x-auto"><table className="w-full border border-border text-left text-sm"><thead><tr>{record.headers.map((header, index) => <th key={index} className="border border-border bg-muted p-3">{typeof header === "string" ? header : ""}</th>)}</tr></thead><tbody>{record.rows.map((row, rowIndex) => <tr key={rowIndex}>{Array.isArray(row) ? row.map((cell, index) => <td key={index} className="border border-border p-3">{typeof cell === "string" ? cell : ""}</td>) : null}</tr>)}</tbody></table></div>;
  if (type === "faq_group" && Array.isArray(record.items)) return <section className="border border-border"><h2 className="border-b border-border p-4 text-2xl font-semibold">Frequently Asked Questions</h2>{record.items.map((item, index) => isJsonRecord(item) ? <div key={index} className="grid gap-2 border-t border-border p-4 first:border-t-0 md:grid-cols-[1fr_2fr]"><h3 className="font-semibold">{typeof item.question === "string" ? item.question : ""}</h3><p>{typeof item.answer === "string" ? item.answer : ""}</p></div> : null)}</section>;
  if (type === "image" && typeof record.imageId === "string") { const url = imageUrls.get(record.imageId); return url ? <img src={url} alt={typeof record.alt === "string" ? record.alt : "Article image"} className="max-h-[32rem] w-full object-contain" /> : null; }
  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await getCachedPublishedArticleBySlug(slug);
  if (!result) return buildPageMetadata({ title: "Article Not Found", description: "The requested aquarium article could not be found.", path: `/learning-center/${slug}`, robots: NOINDEX_NOFOLLOW });
  return buildPageMetadata({
    title: result.article.seo_title ?? result.article.title ?? "Aquarium Article",
    description: result.article.meta_description ?? result.article.summary ?? "Practical freshwater aquarium education from GuideMyTank.",
    path: `/learning-center/${result.article.slug}`,
    type: "article",
    publishedTime: result.article.published_at,
    modifiedTime: result.article.updated_at,
    publisher: "GuideMyTank",
  });
}

export const revalidate = 604_800; // CACHE_TTL.careGuides
export const dynamic = "force-static";

export function generateStaticParams() {
  return [];
}

export default async function PublishedArticlePage({ params }: Props) {
  const { slug } = await params;
  const result = await getCachedPublishedArticleBySlug(slug);
  if (!result) notFound();
  const { article, sections, images, sources, categories, tags } = result;
  const internalLinks = await getArticlePageLinks(result);
  const signed = await createPublishedContentImageSignedUrls(images.map((item) => item.content_images.storage_path));
  const imageUrls = new Map(images.map((item) => [item.image_id, signed.get(item.content_images.storage_path) ?? ""]));
  const galleryImages = images.map((item) => ({ id: item.image_id, url: imageUrls.get(item.image_id) ?? "", alt: item.content_images.alt_text ?? "Article image", caption: item.content_images.caption, attribution: item.content_images.attribution, sourceUrl: item.content_images.source_url, licenseName: item.content_images.license_name, licenseUrl: item.content_images.license_url }));
  const [introduction, ...remainingSections] = sections;
  const articlePath = `/learning-center/${article.slug}`;
  const canonical = getSiteUrl(articlePath);
  const breadcrumbs = [{ name: "Home", path: "/" }, { name: "Learning Center", path: "/learning-center" }, { name: article.title ?? "Article", path: articlePath }];
  const visibleFaqs = sections.flatMap((section) => { const value = isJsonRecord(section.content) ? section.content.items : null; return section.block_type === "faq_group" && Array.isArray(value) ? value.filter(isJsonRecord).map((item) => ({ question: typeof item.question === "string" ? item.question : null, answer: typeof item.answer === "string" ? item.answer : null })) : []; });
  const schemaEntities = buildArticlePageEntities({
    path: articlePath,
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
    {introduction ? <div className="mt-10"><Block type={introduction.block_type} content={introduction.content} imageUrls={imageUrls} /></div> : null}
    {galleryImages.length ? <div className="mb-16 mt-8"><ArticleImageFlipbook images={galleryImages} /></div> : null}
    <div className="space-y-8">{remainingSections.map((section) => <section id={`section-${section.id}`} key={section.id} className="scroll-mt-24"><Block type={section.block_type} content={section.content} imageUrls={imageUrls} /></section>)}</div>
    <SourcesList sources={sources} />
    <InternalLinksSection title="Fish Featured in This Guide" description="Explore the care requirements and structured profiles for the ten fish covered above." items={internalLinks.clusterSpecies} limit={10} />
    <InternalLinksSection title="Relevant Species" items={internalLinks.species} limit={4} />
    <InternalLinksSection title="Related Care Guides" items={internalLinks.careGuides} limit={4} />
    <InternalLinksSection title="Compatibility Research" description="Review these pair reports before planning a shared aquarium." items={internalLinks.compatibilityReports} limit={4} />
    <InternalLinksSection title="Related Articles" items={internalLinks.relatedArticles} limit={4} />
    <InternalLinksSection title="Topic Cluster" items={internalLinks.topicClusters} limit={1} />
    <BuilderCallToAction item={internalLinks.builder[0]} />
    <InternalLinksSection title="Product Resources" items={internalLinks.productCategories} limit={1} />
    <ShareLinks title={article.title ?? "GuideMyTank article"} url={canonical} />
  </article></PageContainer>;
}

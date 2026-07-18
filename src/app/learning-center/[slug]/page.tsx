/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArticleImageFlipbook } from "@/components/articles/article-image-grid";
import { AdvertisementSlot, ContentBreadcrumbs, ContentByline, JsonLd, RelatedLinks, ShareLinks, SourcesList } from "@/components/content/public-content";
import { PageContainer } from "@/components/site/page-container";
import { getPublishedArticleBySlug } from "@/lib/articles/service";
import { createPublishedContentImageSignedUrls } from "@/lib/content-images/service";
import { isJsonRecord } from "@/lib/content/structured-data";
import type { Json } from "@/types/database.types";

type Props = { params: Promise<{ slug: string }> };

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
  const result = await getPublishedArticleBySlug(slug);
  if (!result) return {};
  return {
    title: result.article.seo_title ?? `${result.article.title} | GuideMyTank`,
    description: result.article.meta_description ?? result.article.summary ?? undefined,
    alternates: { canonical: result.article.canonical_url ?? `https://www.guidemytank.com/learning-center/${result.article.slug}` },
    openGraph: { title: result.article.seo_title ?? result.article.title ?? undefined, description: result.article.meta_description ?? result.article.summary ?? undefined, type: "article", publishedTime: result.article.published_at ?? undefined, modifiedTime: result.article.updated_at },
  };
}

export const revalidate = 3600;

export default async function PublishedArticlePage({ params }: Props) {
  const { slug } = await params;
  const result = await getPublishedArticleBySlug(slug);
  if (!result) notFound();
  const { article, sections, images, sources, categories, tags, relatedArticles, relatedCareGuides } = result;
  const signed = await createPublishedContentImageSignedUrls(images.map((item) => item.content_images.storage_path));
  const imageUrls = new Map(images.map((item) => [item.image_id, signed.get(item.content_images.storage_path) ?? ""]));
  const galleryImages = images.map((item) => ({ id: item.image_id, url: imageUrls.get(item.image_id) ?? "", alt: item.content_images.alt_text ?? "Article image", caption: item.content_images.caption, attribution: item.content_images.attribution, sourceUrl: item.content_images.source_url, licenseName: item.content_images.license_name, licenseUrl: item.content_images.license_url }));
  const [introduction, ...remainingSections] = sections;
  const canonical = article.canonical_url ?? `https://www.guidemytank.com/learning-center/${article.slug}`;
  const faqItems = sections.flatMap((section) => { const value = isJsonRecord(section.content) ? section.content.items : null; return section.block_type === "faq_group" && Array.isArray(value) ? value.filter(isJsonRecord).map((item) => ({ "@type": "Question", name: typeof item.question === "string" ? item.question : "", acceptedAnswer: { "@type": "Answer", text: typeof item.answer === "string" ? item.answer : "" } })) : []; });
  const structuredData: Array<Record<string, unknown>> = [{ "@context": "https://schema.org", "@type": "Article", headline: article.title, description: article.summary, datePublished: article.published_at, dateModified: article.updated_at, author: { "@type": "Organization", name: "GuideMyTank" }, mainEntityOfPage: canonical }, { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: "https://www.guidemytank.com" }, { "@type": "ListItem", position: 2, name: "Learning Center", item: "https://www.guidemytank.com/learning-center" }, { "@type": "ListItem", position: 3, name: article.title, item: canonical }] }];
  if (faqItems.length) structuredData.push({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqItems });

  return <PageContainer><article className="mx-auto max-w-4xl">
    <JsonLd data={structuredData} />
    <ContentBreadcrumbs items={[{ label: "Home", href: "/" }, { label: "Learning Center", href: "/learning-center" }, { label: article.title ?? "Article" }]} />
    <header><div className="flex flex-wrap gap-2 text-xs uppercase text-muted-foreground">{categories.map((item) => <span key={item.category_id}>{item.article_categories.name}</span>)}</div><h1 className="mt-2 text-4xl font-bold tracking-tight">{article.title}</h1>{article.summary ? <p className="mt-4 text-lg leading-8 text-muted-foreground">{article.summary}</p> : null}<ContentByline publishedAt={article.published_at} updatedAt={article.updated_at} /><div className="mt-3 flex flex-wrap gap-2">{tags.map((item) => <span key={item.tag_id} className="border border-border px-2 py-1 text-xs">{item.article_tags.name}</span>)}</div></header>
    {introduction ? <div className="mt-10"><Block type={introduction.block_type} content={introduction.content} imageUrls={imageUrls} /></div> : null}
    {galleryImages.length ? <div className="mb-16 mt-8"><ArticleImageFlipbook images={galleryImages} /></div> : null}
    <AdvertisementSlot name="content-top" />
    <div className="space-y-8">{remainingSections.map((section) => <section id={`section-${section.id}`} key={section.id} className="scroll-mt-24"><Block type={section.block_type} content={section.content} imageUrls={imageUrls} /></section>)}</div>
    <SourcesList sources={sources} />
    <RelatedLinks title="Related Care Guides" items={relatedCareGuides.filter((item) => item.care_guide?.status === "published").map((item) => ({ href: `/care-guides/${item.care_guide!.slug}`, title: item.care_guide!.title ?? "Care Guide", description: item.care_guide!.summary }))} />
    <RelatedLinks title="Related articles" items={relatedArticles.filter((item) => item.related_article?.status === "published").map((item) => ({ href: `/learning-center/${item.related_article!.slug}`, title: item.related_article!.title ?? "Article", description: item.related_article!.summary }))} />
    <ShareLinks title={article.title ?? "GuideMyTank article"} url={canonical} />
  </article></PageContainer>;
}

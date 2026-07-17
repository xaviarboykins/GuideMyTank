/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArticleImageFlipbook } from "@/components/articles/article-image-grid";
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
    title: `${result.article.title} | GuideMyTank`,
    description: result.article.meta_description ?? result.article.summary ?? undefined,
    alternates: { canonical: `https://www.guidemytank.com/learning-center/${result.article.slug}` },
    openGraph: { title: result.article.title ?? undefined, description: result.article.summary ?? undefined, type: "article", publishedTime: result.article.published_at ?? undefined },
  };
}

export const revalidate = 3600;

export default async function PublishedArticlePage({ params }: Props) {
  const { slug } = await params;
  const result = await getPublishedArticleBySlug(slug);
  if (!result) notFound();
  const { article, sections, images, sources, categories, tags } = result;
  const signed = await createPublishedContentImageSignedUrls(images.map((item) => item.content_images.storage_path));
  const imageUrls = new Map(images.map((item) => [item.image_id, signed.get(item.content_images.storage_path) ?? ""]));
  const galleryImages = images.map((item) => ({ id: item.image_id, url: imageUrls.get(item.image_id) ?? "", alt: item.content_images.alt_text ?? "Article image", caption: item.content_images.caption }));
  const [introduction, ...remainingSections] = sections;

  return <PageContainer><article className="mx-auto max-w-4xl">
    <Link href="/learning-center" className="text-sm text-muted-foreground underline">Back to Learning Center</Link>
    <header className="mt-6"><div className="flex flex-wrap gap-2 text-xs uppercase text-muted-foreground">{categories.map((item) => <span key={item.category_id}>{item.article_categories.name}</span>)}</div><h1 className="mt-2 text-4xl font-bold tracking-tight">{article.title}</h1>{article.summary ? <p className="mt-4 text-lg leading-8 text-muted-foreground">{article.summary}</p> : null}<div className="mt-3 flex flex-wrap gap-2">{tags.map((item) => <span key={item.tag_id} className="border border-border px-2 py-1 text-xs">{item.article_tags.name}</span>)}</div></header>
    {introduction ? <div className="mt-10"><Block type={introduction.block_type} content={introduction.content} imageUrls={imageUrls} /></div> : null}
    {galleryImages.length ? <div className="mb-16 mt-8"><ArticleImageFlipbook images={galleryImages} /></div> : null}
    <div className="space-y-8">{remainingSections.map((section) => <Block key={section.id} type={section.block_type} content={section.content} imageUrls={imageUrls} />)}</div>
    {sources.length ? <section className="mt-12 border-t border-border pt-6"><h2 className="text-xl font-semibold">Sources</h2><ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">{sources.map((item) => <li key={item.source_id}>{item.sources.url ? <a href={item.sources.url} target="_blank" rel="noreferrer" className="underline">{item.sources.title}</a> : item.sources.title}</li>)}</ol></section> : null}
  </article></PageContainer>;
}

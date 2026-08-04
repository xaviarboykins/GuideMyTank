import Link from "next/link";

import type { BreadcrumbItem } from "@/lib/seo/breadcrumbs";

export function ContentBreadcrumbs({ items }: { items: readonly BreadcrumbItem[] }) {
  return <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground"><ol className="flex flex-wrap gap-2">{items.map((item, index) => { const isCurrentPage = index === items.length - 1; return <li key={item.path} className="flex gap-2">{index ? <span aria-hidden="true">/</span> : null}{isCurrentPage ? <span aria-current="page">{item.name}</span> : <Link href={item.path} className="underline-offset-4 hover:underline">{item.name}</Link>}</li>; })}</ol></nav>;
}

export function ContentByline({ publishedAt, updatedAt }: { publishedAt: string | null; updatedAt: string }) {
  const format = (value: string) => new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(value));
  return <p className="mt-4 text-sm text-muted-foreground">By GuideMyTank Editorial Team{publishedAt ? <> · Published <time dateTime={publishedAt}>{format(publishedAt)}</time></> : null}{updatedAt && updatedAt !== publishedAt ? <> · Updated <time dateTime={updatedAt}>{format(updatedAt)}</time></> : null}</p>;
}

export function ImageCredit({ attribution, sourceUrl, licenseName, licenseUrl }: { attribution?: string | null; sourceUrl?: string | null; licenseName?: string | null; licenseUrl?: string | null }) {
  if (!attribution && !licenseName) return null;
  return <p className="mt-1 text-xs text-muted-foreground">Image: {sourceUrl && attribution ? <a href={sourceUrl} rel="noreferrer" target="_blank" className="underline">{attribution}</a> : attribution ?? "Source credited"}{licenseName ? <> · {licenseUrl ? <a href={licenseUrl} rel="noreferrer" target="_blank" className="underline">{licenseName}</a> : licenseName}</> : null}</p>;
}

export function SourcesList({ sources }: { sources: Array<{ source_id: string; sources: { title: string; url: string | null; author?: string | null; publisher?: string | null } }> }) {
  if (!sources.length) return null;
  return <section id="sources" className="mt-12 border-t border-border pt-6"><h2 className="text-xl font-semibold">Sources and references</h2><ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">{sources.map((item) => <li key={item.source_id}>{item.sources.url ? <a href={item.sources.url} target="_blank" rel="noreferrer" className="underline">{item.sources.title}</a> : item.sources.title}{item.sources.author ? ` — ${item.sources.author}` : ""}{item.sources.publisher ? `, ${item.sources.publisher}` : ""}</li>)}</ol></section>;
}

export function RelatedLinks({ title, items }: { title: string; items: Array<{ href: string; title: string; description?: string | null }> }) {
  if (!items.length) return null;
  return <section className="mt-12 border-t border-border pt-6"><h2 className="text-xl font-semibold">{title}</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{items.map((item) => <Link key={item.href} href={item.href} className="border border-border bg-card p-4 hover:bg-muted/50"><h3 className="font-semibold">{item.title}</h3>{item.description ? <p className="mt-1 text-sm text-muted-foreground">{item.description}</p> : null}</Link>)}</div></section>;
}

export function ShareLinks({ title, url }: { title: string; url: string }) {
  const encodedUrl = encodeURIComponent(url); const encodedTitle = encodeURIComponent(title);
  return <div aria-label="Share this page" className="mt-8 flex flex-wrap items-center gap-3 text-sm"><span className="font-medium">Share:</span><a className="underline" href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noreferrer">Facebook</a><a className="underline" href={`https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`} target="_blank" rel="noreferrer">Reddit</a><a className="underline" href={`mailto:?subject=${encodedTitle}&body=${encodedUrl}`}>Email</a></div>;
}

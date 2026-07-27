/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

type GuideCardProps = {
  guide: {
    id: string;
    title: string | null;
    slug: string | null;
    summary: string | null;
    published_at: string | null;
    article_category_assignments: Array<{ category_id: string; article_categories: { name: string; slug: string } }>;
  };
  imageUrl?: string;
  imageAlt?: string | null;
};

export function GuideCard({ guide, imageUrl, imageAlt }: GuideCardProps) {
  if (!guide.slug) return null;
  return <article className="overflow-hidden border border-border bg-card">
    <Link href={`/learning-center/guides/${guide.slug}`} className="group flex h-full flex-col">
      {imageUrl ? <img src={imageUrl} alt={imageAlt ?? guide.title ?? "Aquarium Guide"} className="aspect-[16/9] w-full object-cover" /> : null}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap gap-2 text-xs uppercase text-muted-foreground">{guide.article_category_assignments.map((item) => <span key={item.category_id}>{item.article_categories.name}</span>)}</div>
        <h3 className="mt-2 text-xl font-semibold group-hover:underline">{guide.title}</h3>
        {guide.summary ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{guide.summary}</p> : null}
        {guide.published_at ? <time className="mt-auto pt-5 text-xs text-muted-foreground" dateTime={guide.published_at}>{new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(guide.published_at))}</time> : null}
      </div>
    </Link>
  </article>;
}

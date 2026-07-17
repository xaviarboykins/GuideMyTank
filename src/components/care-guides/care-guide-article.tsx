import type { Json } from "@/types/database.types";
import styles from "./care-guide-article.module.css";

type ImageAssignment = {
  image_id: string;
  is_primary: boolean;
  content_images: { storage_path: string; alt_text: string | null; caption: string | null };
};

type Section = { id: string; section_type: string; heading: string | null; content: Json };
type SourceAssignment = { source_id: string; sources: { title: string; url: string | null } };

function record(value: Json) {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value : {};
}

function parseFaq(text: string) {
  const items: { question: string; answer: string }[] = [];
  const pattern = /([^?]+\?)\s*([^?]*?)(?=\s+(?:Can|Does|Why|How|What|When|Where|Is|Are|Should|Will)\b[^?]*\?|$)/g;
  for (const match of text.matchAll(pattern)) {
    const question = match[1].trim();
    const answer = match[2].trim();
    if (question && answer) items.push({ question, answer });
  }
  return items;
}

function GuideImage({ assignment, url, className }: { assignment?: ImageAssignment; url?: string; className: string }) {
  if (!assignment || !url) return null;
  return (
    <figure>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={assignment.content_images.alt_text ?? ""} className={className} />
      {assignment.content_images.caption ? <figcaption className="mt-2 text-sm leading-5 text-muted-foreground">{assignment.content_images.caption}</figcaption> : null}
    </figure>
  );
}

export function CareGuideArticle({ guide, sections, images, sources, imageUrls }: {
  guide: { title: string | null; summary: string | null; quick_facts: Json; species: { common_name: string; scientific_name: string } };
  sections: Section[];
  images: ImageAssignment[];
  sources: SourceAssignment[];
  imageUrls: Map<string, string>;
}) {
  const quickFacts = record(guide.quick_facts);
  const primary = images.find((image) => image.is_primary) ?? images[0];
  const secondary = images.find((image) => image.image_id !== primary?.image_id);
  const faqSection = sections.find((section) => section.section_type === "frequently_asked_questions");
  const articleSections = sections.filter((section) => section.id !== faqSection?.id);
  const midpoint = Math.ceil(articleSections.length / 2);
  const columns = [articleSections.slice(0, midpoint), articleSections.slice(midpoint)];
  const faqContent = faqSection ? record(faqSection.content) : {};
  const faqItems = parseFaq(typeof faqContent.text === "string" ? faqContent.text : "");

  return (
    <article>
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{guide.species.common_name} Care Guide</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">{guide.title ?? `${guide.species.common_name} Care Guide`}</h1>
        <p className="mt-2 italic text-muted-foreground">{guide.species.scientific_name}</p>
        {guide.summary ? <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">{guide.summary}</p> : null}
      </header>

      <section className={`mt-8 ${styles.topGrid}`}>
        <div className="min-w-0">
          <GuideImage assignment={primary} url={primary ? imageUrls.get(primary.content_images.storage_path) : undefined} className={`${styles.primaryImage} border border-border bg-muted`} />
        </div>
        <aside className="min-w-0 border border-border bg-card p-5">
          <h2 className="text-xl font-semibold">Quick facts</h2>
          <dl className={`mt-4 grid grid-cols-2 ${styles.factGrid}`}>{Object.entries(quickFacts).map(([key, value]) => <div key={key} className={`${styles.fact} min-w-0 border-t border-border py-2.5 first:border-t-0 first:pt-0 [&:nth-child(2)]:border-t-0 [&:nth-child(2)]:pt-0`}><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{key.replaceAll("_", " ")}</dt><dd className="mt-1 break-words text-sm leading-5">{typeof value === "string" || typeof value === "number" ? value : "—"}</dd></div>)}</dl>
        </aside>
      </section>

      <section className={`mt-10 items-start px-5 sm:px-8 lg:px-10 ${styles.contentGrid}`}>
        {columns.map((column, columnIndex) => <div key={columnIndex} className="space-y-8">
          {column.map((section, sectionIndex) => {
            const content = record(section.content);
            return <div key={section.id}>
              {columnIndex === 1 && sectionIndex === 2 ? <div className="mb-8"><GuideImage assignment={secondary} url={secondary ? imageUrls.get(secondary.content_images.storage_path) : undefined} className="aspect-[4/3] w-full border border-border bg-muted object-cover" /></div> : null}
              <h2 className="text-2xl font-semibold capitalize">{section.heading ?? section.section_type.replaceAll("_", " ")}</h2>
              <p className="mt-3 whitespace-pre-wrap leading-7">{typeof content.text === "string" ? content.text : ""}</p>
            </div>;
          })}
        </div>)}
      </section>

      {faqSection ? <section className="mx-5 mt-12 sm:mx-8 lg:mx-10">
        <h2 className="text-2xl font-semibold">{faqSection.heading ?? "Frequently Asked Questions"}</h2>
        <div className="mt-5 border border-border">
          {faqItems.length ? faqItems.map((item) => <div key={item.question} className="grid gap-2 border-t border-border p-4 first:border-t-0 md:grid-cols-[minmax(12rem,0.8fr)_minmax(0,1.7fr)] md:gap-6">
            <h3 className="font-semibold leading-6">{item.question}</h3>
            <p className="leading-6 text-muted-foreground">{item.answer}</p>
          </div>) : <p className="p-4 leading-7">{typeof faqContent.text === "string" ? faqContent.text : ""}</p>}
        </div>
      </section> : null}

      {sources.length ? <section className="mx-5 mt-12 border-t border-border pt-6 sm:mx-8 lg:mx-10"><h2 className="text-xl font-semibold">Sources</h2><ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">{sources.map((assignment) => <li key={assignment.source_id}>{assignment.sources.url ? <a href={assignment.sources.url} rel="noreferrer" target="_blank" className="underline underline-offset-2">{assignment.sources.title}</a> : assignment.sources.title}</li>)}</ol></section> : null}
    </article>
  );
}

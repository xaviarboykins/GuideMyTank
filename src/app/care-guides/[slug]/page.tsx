import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageContainer } from "@/components/site/page-container";
import { PageHeader } from "@/components/site/page-header";
import { Button } from "@/components/ui/button";
import { CareGuideArticle } from "@/components/care-guides/care-guide-article";
import { JsonLd } from "@/components/content/public-content";
import { getPublishedCareGuideBySlug, listPublishedCareGuides } from "@/lib/care-guides/service";
import { createPublishedContentImageSignedUrls } from "@/lib/content-images/service";
import { getSpeciesBySlug, getSpeciesSlugs } from "@/lib/data/species";
import { isJsonRecord } from "@/lib/content/structured-data";
import { getSiteUrl } from "@/lib/seo/site-url";
import { NOINDEX_FOLLOW, NOINDEX_NOFOLLOW } from "@/lib/seo/indexability";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getCareGuidePageLinks } from "@/lib/seo/internal-linking/service";

type CareGuidePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const revalidate = 86400;
export const dynamicParams = false;

export async function generateStaticParams() {
  const [species, guides] = await Promise.all([getSpeciesSlugs(), listPublishedCareGuides()]);

  return [...new Set([...species.map((item) => item.slug), ...guides.map((item) => item.slug)])].map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: CareGuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const publishedGuide = await getPublishedCareGuideBySlug(slug);

  if (publishedGuide) {
    const title = publishedGuide.guide.seo_title ?? publishedGuide.guide.title ?? `${publishedGuide.guide.species.common_name} Care Guide`;
    const description = publishedGuide.guide.meta_description ?? publishedGuide.guide.summary ?? `Aquarium care requirements for ${publishedGuide.guide.species.common_name}.`;
    return buildPageMetadata({
      title,
      description,
      path: `/care-guides/${publishedGuide.guide.slug}`,
      type: "article",
      publishedTime: publishedGuide.guide.published_at,
      modifiedTime: publishedGuide.guide.updated_at,
    });
  }

  const species = await getSpeciesBySlug(slug);

  if (!species) {
    return buildPageMetadata({ title: "Care Guide Not Found", description: "The requested aquarium Care Guide could not be found.", path: `/care-guides/${slug}`, robots: NOINDEX_NOFOLLOW });
  }

  const title = `${species.common_name} Care Guide | GuideMyTank`;
  const description = `A complete ${species.common_name} aquarium care guide is coming soon to GuideMyTank.`;
  const canonical = getSiteUrl(`/care-guides/${species.slug}`);

  return buildPageMetadata({
    title,
    description,
    path: new URL(canonical).pathname,
    type: "article",
    robots: NOINDEX_FOLLOW,
  });
}

export default async function CareGuidePage({ params }: CareGuidePageProps) {
  const { slug } = await params;
  const publishedGuide = await getPublishedCareGuideBySlug(slug);

  if (publishedGuide) {
    const [imageUrls, internalLinks] = await Promise.all([
      createPublishedContentImageSignedUrls(publishedGuide.images.map((image) => image.content_images.storage_path)),
      getCareGuidePageLinks(publishedGuide),
    ]);
    const { guide } = publishedGuide;
    const url = getSiteUrl(`/care-guides/${guide.slug}`);
    const structuredData = [{ "@context": "https://schema.org", "@type": "Article", headline: guide.title, description: guide.summary, datePublished: guide.published_at, dateModified: guide.updated_at, author: { "@type": "Organization", name: "GuideMyTank" }, mainEntityOfPage: url }, { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: getSiteUrl() }, { "@type": "ListItem", position: 2, name: "Care Guides", item: getSiteUrl("/care-guides") }, { "@type": "ListItem", position: 3, name: guide.title, item: url }] }] as Array<Record<string, unknown>>;
    const faqSection = publishedGuide.sections.find((section) => section.section_type === "frequently_asked_questions");
    const faqRecord = faqSection && isJsonRecord(faqSection.content) ? faqSection.content : null;
    const faqText = faqRecord && typeof faqRecord.text === "string" ? faqRecord.text : "";
    const faqItems = [...faqText.matchAll(/([^?]+\?)\s*([^?]*?)(?=\s+(?:Can|Does|Why|How|What|When|Where|Is|Are|Should|Will)\b[^?]*\?|$)/g)].filter((match) => match[1]?.trim() && match[2]?.trim()).map((match) => ({ "@type": "Question", name: match[1].trim(), acceptedAnswer: { "@type": "Answer", text: match[2].trim() } }));
    if (faqItems.length) structuredData.push({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqItems });
    return <PageContainer><JsonLd data={structuredData} /><CareGuideArticle {...publishedGuide} imageUrls={imageUrls} internalLinks={internalLinks} /></PageContainer>;
  }

  const species = await getSpeciesBySlug(slug);

  if (!species) {
    notFound();
  }

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Aquarium Care Guide"
        title={`${species.common_name} Care Guide`}
        description={species.scientific_name}
      />

      <article className="mt-6 border border-border bg-card p-6 md:p-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Article coming soon
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight">
            We&apos;re preparing this care guide.
          </h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            The complete {species.common_name} guide will cover habitat setup,
            water parameters, feeding, behavior, common health concerns, and
            long-term care.
          </p>

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild>
              <Link href={`/species/${species.slug}`}>
                View Species Data
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/care-guides">Back to Care Guides</Link>
            </Button>
          </div>
        </div>
      </article>
    </PageContainer>
  );
}

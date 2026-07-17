import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageContainer } from "@/components/site/page-container";
import { PageHeader } from "@/components/site/page-header";
import { Button } from "@/components/ui/button";
import { CareGuideArticle } from "@/components/care-guides/care-guide-article";
import { getPublishedCareGuideBySlug } from "@/lib/care-guides/service";
import { createPublishedContentImageSignedUrls } from "@/lib/content-images/service";
import { getSpeciesBySlug, getSpeciesSlugs } from "@/lib/data/species";

type CareGuidePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const revalidate = 86400;
export const dynamicParams = false;

export async function generateStaticParams() {
  const species = await getSpeciesSlugs();

  return species.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: CareGuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const publishedGuide = await getPublishedCareGuideBySlug(slug);

  if (publishedGuide) {
    const title = publishedGuide.guide.seo_title ?? `${publishedGuide.guide.title} | GuideMyTank`;
    const description = publishedGuide.guide.meta_description ?? publishedGuide.guide.summary ?? undefined;
    const canonical = publishedGuide.guide.canonical_url ?? `https://www.guidemytank.com/care-guides/${publishedGuide.guide.slug}`;
    return { title, description, alternates: { canonical }, openGraph: { title, description, url: canonical, type: "article" } };
  }

  const species = await getSpeciesBySlug(slug);

  if (!species) {
    return { title: "Care Guide Not Found | GuideMyTank" };
  }

  const title = `${species.common_name} Care Guide | GuideMyTank`;
  const description = `A complete ${species.common_name} aquarium care guide is coming soon to GuideMyTank.`;
  const canonical = `https://www.guidemytank.com/care-guides/${species.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "article" },
  };
}

export default async function CareGuidePage({ params }: CareGuidePageProps) {
  const { slug } = await params;
  const publishedGuide = await getPublishedCareGuideBySlug(slug);

  if (publishedGuide) {
    const imageUrls = await createPublishedContentImageSignedUrls(publishedGuide.images.map((image) => image.content_images.storage_path));
    return <PageContainer><CareGuideArticle {...publishedGuide} imageUrls={imageUrls} /></PageContainer>;
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

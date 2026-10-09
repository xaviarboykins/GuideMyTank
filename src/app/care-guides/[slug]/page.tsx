import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { PageContainer } from "@/components/site/page-container";
import { CareGuideArticle } from "@/components/care-guides/care-guide-article";
import { JsonLd } from "@/components/seo/json-ld";
import { getPublishedCareGuideBySlug, listPublishedCareGuides } from "@/lib/care-guides/service";
import { createPublishedContentImageSignedUrls } from "@/lib/content-images/public";
import { NOINDEX_NOFOLLOW } from "@/lib/seo/indexability";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getCareGuidePageLinks } from "@/lib/seo/internal-linking/service";
import { buildArticlePageEntities } from "@/lib/seo/schema/article-page";

type CareGuidePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const getCachedPublishedCareGuideBySlug = cache(getPublishedCareGuideBySlug);

export const revalidate = 604_800; // CACHE_TTL.careGuides
export const dynamicParams = true;

export async function generateStaticParams() {
  const guides = await listPublishedCareGuides();
  return guides.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: CareGuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const publishedGuide = await getCachedPublishedCareGuideBySlug(slug);

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
      publisher: "GuideMyTank",
    });
  }

  return buildPageMetadata({ title: "Care Guide Not Found", description: "The requested aquarium Care Guide could not be found.", path: `/care-guides/${slug}`, robots: NOINDEX_NOFOLLOW });
}

export default async function CareGuidePage({ params }: CareGuidePageProps) {
  const { slug } = await params;
  const publishedGuide = await getCachedPublishedCareGuideBySlug(slug);

  if (publishedGuide) {
    const [imageUrls, internalLinks] = await Promise.all([
      createPublishedContentImageSignedUrls(
        publishedGuide.images.map((image) => image.content_images.storage_path),
      ),
      getCareGuidePageLinks(publishedGuide),
    ]);
    const { guide } = publishedGuide;
    const guidePath = `/care-guides/${guide.slug}`;
    const breadcrumbs = [{ name: "Home", path: "/" }, { name: "Care Guides", path: "/care-guides" }, { name: guide.title ?? `${guide.species.common_name} Care Guide`, path: guidePath }];
    const schemaEntities = buildArticlePageEntities({
      path: guidePath,
      headline: guide.title,
      description: guide.summary,
      datePublished: guide.published_at,
      dateModified: guide.updated_at,
      articleSection: "Care Guides",
      breadcrumbs,
    });
    return <PageContainer><JsonLd entities={schemaEntities} /><CareGuideArticle {...publishedGuide} imageUrls={imageUrls} breadcrumbs={breadcrumbs} internalLinks={internalLinks} /></PageContainer>;
  }

  notFound();
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { cache } from "react";

import { CompatibilitySummary } from "@/components/compatibility/compatibility-summary";
import { InternalLinksSection } from "@/components/internal-linking/internal-links-section";
import { PageContainer } from "@/components/site/page-container";
import { PageHeader } from "@/components/site/page-header";
import { ContentBreadcrumbs } from "@/components/content/public-content";
import { JsonLd } from "@/components/seo/json-ld";
import { getCompatibilityReport } from "@/lib/data/compatibility";
import {
  getCompatibilityPath,
  getCompatibilityUrl,
  isCanonicalCompatibilityPair,
} from "@/lib/compatibility/urls";
import { getCompatibilityReportIndexability } from "@/lib/compatibility/indexability";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { NOINDEX_FOLLOW, NOINDEX_NOFOLLOW } from "@/lib/seo/indexability";
import { getCompatibilityPageLinks } from "@/lib/seo/internal-linking/service";
import { buildCompatibilityPageEntities } from "@/lib/seo/schema/compatibility-page";

type CompatibilityPageProps = {
  params: Promise<{
    speciesA: string;
    speciesB: string;
  }>;
};

const getCachedCompatibilityReport = cache(getCompatibilityReport);

export const revalidate = 2_592_000; // CACHE_TTL.compatibility
export const dynamic = "force-static";
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: CompatibilityPageProps): Promise<Metadata> {
  const { speciesA, speciesB } = await params;

  const canonicalUrl = getCompatibilityUrl(speciesA, speciesB);
  const report = await getCachedCompatibilityReport(speciesA, speciesB);

  if (!report) {
    return buildPageMetadata({
      title: "Compatibility Report Not Found",
      description: "The requested aquarium compatibility report could not be found.",
      path: getCompatibilityPath(speciesA, speciesB),
      robots: NOINDEX_NOFOLLOW,
    });
  }

  const compatibility = report.result;
  const quality = getCompatibilityReportIndexability(report);

  const speciesAName = compatibility.species_a.common_name;
  const speciesBName = compatibility.species_b.common_name;

  const title = `Can ${speciesAName} Live With ${speciesBName}? Compatibility Guide`;
  const description = `GuideMyTank rates ${speciesAName} and ${speciesBName} as ${compatibility.verdict.replaceAll("-", " ")}. Review the risks, required conditions, water parameters, behavior, and source-data confidence.`;

  return buildPageMetadata({
    title,
    description,
    path: new URL(canonicalUrl).pathname,
    robots: quality.indexable ? undefined : NOINDEX_FOLLOW,
  });
}

export default async function CompatibilityDetailPage({
  params,
}: CompatibilityPageProps) {
  const { speciesA, speciesB } = await params;

  if (!isCanonicalCompatibilityPair(speciesA, speciesB)) {
    permanentRedirect(getCompatibilityPath(speciesA, speciesB));
  }

  const report = await getCachedCompatibilityReport(speciesA, speciesB);

  if (!report) {
    notFound();
  }

  const compatibility = report.result;
  const analysis = report.analysis;
  const quality = getCompatibilityReportIndexability(report);

  const internalLinks = await getCompatibilityPageLinks(compatibility);
  const speciesAName = compatibility.species_a.common_name;
  const speciesBName = compatibility.species_b.common_name;
  const compatibilityPath = getCompatibilityPath(speciesA, speciesB);
  const pageTitle = `Can ${speciesAName} Live With ${speciesBName}?`;
  const pageDescription = `GuideMyTank compatibility analysis for ${speciesAName} and ${speciesBName}.`;
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Compatibility", path: "/compatibility" },
    {
      name: `${speciesAName} and ${speciesBName} Compatibility`,
      path: compatibilityPath,
    },
  ];
  const schemaEntities = buildCompatibilityPageEntities({
    speciesA: {
      slug: compatibility.species_a.slug,
      name: speciesAName,
    },
    speciesB: {
      slug: compatibility.species_b.slug,
      name: speciesBName,
    },
    name: pageTitle,
    description: pageDescription,
    breadcrumbs,
  });

  return (
    <PageContainer>
      <JsonLd entities={schemaEntities} />

      <ContentBreadcrumbs items={breadcrumbs} />

      <PageHeader
        eyebrow="Compatibility Report"
        title={pageTitle}
        description={pageDescription}
      />

      <CompatibilitySummary report={report} />

      <section className="mt-10 grid gap-6 lg:grid-cols-3">
        <div className="border-y py-6 lg:col-span-2">
          <h2 className="text-xl font-semibold">Why This Pair Received Its Verdict</h2>

          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            {analysis.overview}
          </p>

          {analysis.keyFindings.length > 0 && (
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
              {analysis.keyFindings.map((finding) => (
                <li key={finding}>{finding}</li>
              ))}
            </ul>
          )}
        </div>

        <aside className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold">Helpful Links</h2>

          <div className="mt-4 flex flex-col gap-2 text-sm">
            <Link
              href="/compatibility"
              className="underline-offset-4 hover:underline"
            >
              Use the Compatibility Checker
            </Link>

            <Link
              href="/compatibility/disclaimer"
              className="underline-offset-4 hover:underline"
            >
              Read the Compatibility Disclaimer
            </Link>
          </div>
        </aside>
      </section>

      <section className="mt-6 divide-y border-y">
        {[
          ["Water Parameter Overlap", analysis.water],
          ["Aquarium Space and Adult Size", analysis.space],
          ["Behavior and Social Requirements", analysis.behavior],
          ["Husbandry Fit", analysis.husbandry],
        ].map(([title, content]) => (
          <div key={title} className="grid gap-3 py-6 md:grid-cols-[14rem_1fr] md:gap-8">
            <h2 className="font-semibold">{title}</h2>
            <p className="text-sm leading-7 text-muted-foreground">{content}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 border-y py-6">
        <h2 className="text-xl font-semibold">What Would Change the Decision?</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Use these pair-specific boundaries before treating the verdict as an
          acceptable stocking plan.
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
          {analysis.decisionGuide.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="mt-6 border-y py-6">
        <h2 className="text-xl font-semibold">Aquarium Planning Checklist</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
          {analysis.checklist.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-lg border bg-card p-6">
        <h2 className="text-xl font-semibold">Final Recommendation</h2>

        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          {compatibility.recommendation}
        </p>
      </section>

      <section className="mt-6 border-y py-6">
        <h2 className="text-xl font-semibold">Sources and Data Provenance</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          These references support the underlying species records used by this
          assessment. They do not necessarily evaluate this exact pair together.
        </p>

        {report.sources.length > 0 ? (
          <ul className="mt-4 divide-y border-y text-sm">
            {report.sources.map((source) => (
              <li key={source.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium underline-offset-4 hover:underline"
                >
                  {source.label ?? source.url}
                </a>
                <span className="text-xs capitalize text-muted-foreground">
                  {source.category.replaceAll("_", " ")} · {source.confidence} confidence
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            No public source references are attached to these species records yet.
            Treat the result as provisional and confirm it with species-specific research.
          </p>
        )}

        <Link href="/compatibility/disclaimer" className="mt-4 inline-block text-sm font-medium underline-offset-4 hover:underline">
          Read the full methodology and limitations
        </Link>

        <dl className="mt-5 grid gap-3 border-t pt-4 text-xs text-muted-foreground sm:grid-cols-3">
          <div>
            <dt className="font-medium text-foreground">Report quality</dt>
            <dd className="mt-1 capitalize">{quality.tier}</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Analysis version</dt>
            <dd className="mt-1">{analysis.version}</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Species data updated</dt>
            <dd className="mt-1">
              {analysis.sourceDataUpdatedAt
                ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
                    new Date(analysis.sourceDataUpdatedAt),
                  )
                : "No update date recorded"}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Review status</dt>
            <dd className="mt-1">
              {compatibility.expertValidated
                ? "Expert-reviewed override"
                : "Structured automated assessment"}
            </dd>
          </div>
        </dl>
      </section>

      <InternalLinksSection
        title="Related Resources"
        description={`Continue with the most relevant care and compatibility resources for ${speciesAName} and ${speciesBName}.`}
        items={[
          ...internalLinks.careGuides,
          ...internalLinks.topicClusters,
          ...internalLinks.relatedCompatibility,
          ...internalLinks.builder,
        ]}
        limit={5}
      />
    </PageContainer>
  );
}

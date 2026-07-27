import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";

import { CompatibilitySummary } from "@/components/compatibility/compatibility-summary";
import { BuilderCallToAction } from "@/components/internal-linking/builder-call-to-action";
import { InternalLinksSection } from "@/components/internal-linking/internal-links-section";
import { PageContainer } from "@/components/site/page-container";
import { PageHeader } from "@/components/site/page-header";
import { ContentBreadcrumbs } from "@/components/content/public-content";
import { JsonLd } from "@/components/seo/json-ld";
import { getCompatibilityRule } from "@/lib/data/compatibility";
import { getSpeciesSlugs } from "@/lib/data/species";
import {
  generateCanonicalCompatibilityPairs,
  getCompatibilityPath,
  getCompatibilityUrl,
  isCanonicalCompatibilityPair,
} from "@/lib/compatibility/urls";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { NOINDEX_NOFOLLOW } from "@/lib/seo/indexability";
import { getCompatibilityPageLinks } from "@/lib/seo/internal-linking/service";
import { buildCompatibilityPageEntities } from "@/lib/seo/schema/compatibility-page";

type CompatibilityPageProps = {
  params: Promise<{
    speciesA: string;
    speciesB: string;
  }>;
};

export const revalidate = 86400;
export const dynamicParams = false;

export async function generateStaticParams() {
  const species = await getSpeciesSlugs();

  return generateCanonicalCompatibilityPairs(species).map((pair) => ({
    speciesA: pair.speciesA,
    speciesB: pair.speciesB,
  }));
}

export async function generateMetadata({
  params,
}: CompatibilityPageProps): Promise<Metadata> {
  const { speciesA, speciesB } = await params;

  const canonicalUrl = getCompatibilityUrl(speciesA, speciesB);
  const compatibility = await getCompatibilityRule(speciesA, speciesB);

  if (!compatibility) {
    return buildPageMetadata({
      title: "Compatibility Report Not Found",
      description: "The requested aquarium compatibility report could not be found.",
      path: getCompatibilityPath(speciesA, speciesB),
      robots: NOINDEX_NOFOLLOW,
    });
  }

  const speciesAName = compatibility.species_a.common_name;
  const speciesBName = compatibility.species_b.common_name;

  const title = `Can ${speciesAName} Live With ${speciesBName}? Compatibility Guide`;
  const description = `GuideMyTank rates ${speciesAName} and ${speciesBName} as ${compatibility.status}. Review their compatibility score, water parameters, temperament, tank size, and care considerations.`;

  return buildPageMetadata({
    title,
    description,
    path: new URL(canonicalUrl).pathname,
  });
}

export default async function CompatibilityDetailPage({
  params,
}: CompatibilityPageProps) {
  const { speciesA, speciesB } = await params;

  if (!isCanonicalCompatibilityPair(speciesA, speciesB)) {
    permanentRedirect(getCompatibilityPath(speciesA, speciesB));
  }

  const compatibility = await getCompatibilityRule(speciesA, speciesB);

  if (!compatibility) {
    notFound();
  }

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

      <CompatibilitySummary compatibility={compatibility} />

      <section className="mt-10 grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold">Compatibility Overview</h2>

          <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground">
            <p>
              The compatibility score for {speciesAName} and {speciesBName} is{" "}
              <strong className="text-foreground">{compatibility.score}</strong>
              , with an overall status of{" "}
              <strong className="text-foreground">
                {compatibility.status}
              </strong>
              .
            </p>

            <p>
              This report considers important freshwater aquarium factors such
              as water temperature, pH overlap, temperament, schooling behavior,
              adult size, predation risk, and minimum tank size needs.
            </p>

            <p>
              Compatibility scores are intended to support aquarium planning,
              not replace careful observation, quarantine, stocking judgment, or
              species-specific research.
            </p>
          </div>
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

      <section className="mt-6 rounded-lg border bg-card p-6">
        <h2 className="text-xl font-semibold">
          Why This Pair Received This Result
        </h2>

        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-muted-foreground">
          {compatibility.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-lg border bg-card p-6">
        <h2 className="text-xl font-semibold">Final Recommendation</h2>

        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          Based on the available husbandry data, {speciesAName} and{" "}
          {speciesBName} are currently rated as{" "}
          <strong className="text-foreground">{compatibility.status}</strong>.
          Use this result as a starting point, then confirm both species&apos;
          care requirements before adding them to the same aquarium.
        </p>
      </section>

      <InternalLinksSection
        title="Species Care Guides"
        description="Use the complete care requirements alongside this compatibility result."
        items={internalLinks.careGuides}
        limit={2}
      />

      <InternalLinksSection
        title="Related Compatibility Reports"
        description={`Continue researching tank mates for ${speciesAName} and ${speciesBName}.`}
        items={internalLinks.relatedCompatibility}
        limit={6}
      />

      <InternalLinksSection
        title="Explore This Topic"
        items={internalLinks.topicClusters}
      />

      <BuilderCallToAction item={internalLinks.builder[0]} />
    </PageContainer>
  );
}

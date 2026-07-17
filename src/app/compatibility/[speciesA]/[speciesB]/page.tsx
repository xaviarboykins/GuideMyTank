import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";

import { CompatibilitySummary } from "@/components/compatibility/compatibility-summary";
import { PageContainer } from "@/components/site/page-container";
import { PageHeader } from "@/components/site/page-header";
import { getCompatibilityRule } from "@/lib/data/compatibility";
import { getSpeciesSlugs } from "@/lib/data/species";
import {
  generateCanonicalCompatibilityPairs,
  getCompatibilityPath,
  getCompatibilityUrl,
  isCanonicalCompatibilityPair,
} from "@/lib/compatibility/urls";

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
    return {
      title: "Compatibility Report Not Found | GuideMyTank",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const speciesAName = compatibility.species_a.common_name;
  const speciesBName = compatibility.species_b.common_name;

  const title = `Can ${speciesAName} Live With ${speciesBName}? Compatibility Guide`;
  const description = `See the GuideMyTank compatibility score for ${speciesAName} and ${speciesBName}, including temperament, water parameters, tank size, confidence, and care considerations.`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "GuideMyTank",
      type: "article",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
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

  const speciesAName = compatibility.species_a.common_name;
  const speciesBName = compatibility.species_b.common_name;
  const canonicalUrl = getCompatibilityUrl(speciesA, speciesB);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: `Can ${speciesAName} Live With ${speciesBName}?`,
      description: `Aquarium compatibility report for ${speciesAName} and ${speciesBName}.`,
      url: canonicalUrl,
      author: {
        "@type": "Organization",
        name: "GuideMyTank",
      },
      publisher: {
        "@type": "Organization",
        name: "GuideMyTank",
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": canonicalUrl,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://www.guidemytank.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Compatibility",
          item: "https://www.guidemytank.com/compatibility",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: `${speciesAName} and ${speciesBName} Compatibility`,
          item: canonicalUrl,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: `Can ${speciesAName} live with ${speciesBName}?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: `GuideMyTank rates ${speciesAName} and ${speciesBName} as ${compatibility.status} with a compatibility score of ${compatibility.score}. This result is based on aquarium husbandry factors like water parameters, temperament, size, schooling needs, and predation risk.`,
          },
        },
        {
          "@type": "Question",
          name: `Why did ${speciesAName} and ${speciesBName} receive this compatibility result?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: compatibility.reasons.join(" "),
          },
        },
        {
          "@type": "Question",
          name: `Should I use this compatibility score as the final decision?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. Compatibility scores are planning tools. Always confirm each species' care requirements, observe fish behavior carefully, quarantine new additions when possible, and avoid overcrowding.",
          },
        },
      ],
    },
  ];

  return (
    <PageContainer>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />

      <PageHeader
        eyebrow="Compatibility Report"
        title={`Can ${speciesAName} Live With ${speciesBName}?`}
        description={`GuideMyTank compatibility analysis for ${speciesAName} and ${speciesBName}.`}
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
    </PageContainer>
  );
}

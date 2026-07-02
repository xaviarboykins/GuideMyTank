import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageContainer } from "@/components/site/page-container";
import { PageHeader } from "@/components/site/page-header";
import { SpeciesStatCard } from "@/components/species/species-stat-card";
import { SpeciesCompatibilitySections } from "@/components/species/species-compatibility-sections";

import { getCompatibilityRulesForSpecies } from "@/lib/data/compatibility";
import { getSpeciesBySlug, getSpeciesSlugs } from "@/lib/data/species";

const SITE_URL = "https://guidemytank.com";

type SpeciesPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type Species = NonNullable<Awaited<ReturnType<typeof getSpeciesBySlug>>>;
type SpeciesProperty = {
  name: string;
  value: string;
};

function getSpeciesPageUrl(slug: string) {
  return `${SITE_URL}/species/${slug}`;
}

function getSpeciesDescription(species: Species) {
  return (
    species.short_description ??
    `Learn about ${species.common_name} care, tank size, pH, temperature, temperament, diet, and aquarium compatibility.`
  );
}

function getSpeciesJsonLd(species: Species) {
  const url = getSpeciesPageUrl(species.slug);
  const properties = [
    species.scientific_name
      ? { name: "Scientific name", value: species.scientific_name }
      : null,
    species.min_tank_gallons
      ? {
          name: "Minimum tank size",
          value: `${species.min_tank_gallons} gallons`,
        }
      : null,
    species.min_ph && species.max_ph
      ? { name: "pH range", value: `${species.min_ph}-${species.max_ph}` }
      : null,
    species.min_temp_f && species.max_temp_f
      ? {
          name: "Temperature range",
          value: `${species.min_temp_f}-${species.max_temp_f} F`,
        }
      : null,
    species.temperament
      ? { name: "Temperament", value: species.temperament }
      : null,
    species.diet ? { name: "Diet", value: species.diet } : null,
    species.care_level
      ? { name: "Care level", value: species.care_level }
      : null,
    species.max_size_inches
      ? { name: "Adult size", value: `${species.max_size_inches} inches` }
      : null,
  ].filter((property): property is SpeciesProperty => Boolean(property));

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${species.common_name} Care Guide`,
    description: getSpeciesDescription(species),
    url,
    isPartOf: {
      "@type": "WebSite",
      name: "GuideMyTank",
      url: SITE_URL,
    },
    mainEntity: {
      "@type": "Thing",
      name: species.common_name,
      alternateName: species.scientific_name ?? undefined,
      description: getSpeciesDescription(species),
      additionalProperty: properties.map((property) => ({
        "@type": "PropertyValue",
        ...property,
      })),
    },
  };
}

export const revalidate = 86400;

export async function generateStaticParams() {
  const species = await getSpeciesSlugs();

  return species.map((item) => ({
    slug: item.slug,
  }));
}

export async function generateMetadata({
  params,
}: SpeciesPageProps): Promise<Metadata> {
  const { slug } = await params;
  const species = await getSpeciesBySlug(slug);

  if (!species) {
    return {
      title: "Species Not Found | GuideMyTank",
    };
  }

  const title = `${species.common_name} Care Guide | GuideMyTank`;
  const description = getSpeciesDescription(species);
  const url = getSpeciesPageUrl(species.slug);

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "GuideMyTank",
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function SpeciesPage({ params }: SpeciesPageProps) {
  const { slug } = await params;
  const species = await getSpeciesBySlug(slug);
  const compatibility = await getCompatibilityRulesForSpecies(slug);

  if (!species) {
    notFound();
  }

  const jsonLd = getSpeciesJsonLd(species);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <PageContainer>
      <PageHeader
        eyebrow="PisciDex Species Profile"
        title={species.common_name}
        description={
          species.short_description ??
          "Freshwater aquarium species profile with care requirements and tank planning data."
        }
      />

      <section className="mt-6 space-y-2">
        {species.scientific_name && (
          <p className="text-lg italic text-muted-foreground">
            {species.scientific_name}
          </p>
        )}

        <p className="text-sm text-muted-foreground">
          Practical care data for tank planning, compatibility checks, and
          freshwater aquarium stocking decisions.
        </p>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SpeciesStatCard
          label="Tank Size"
          value={
            species.min_tank_gallons
              ? `${species.min_tank_gallons} gallons minimum`
              : null
          }
        />

        <SpeciesStatCard
          label="pH"
          value={
            species.min_ph && species.max_ph
              ? `${species.min_ph}–${species.max_ph}`
              : null
          }
        />

        <SpeciesStatCard
          label="Temperature"
          value={
            species.min_temp_f && species.max_temp_f
              ? `${species.min_temp_f}–${species.max_temp_f}°F`
              : null
          }
        />

        <SpeciesStatCard label="Temperament" value={species.temperament} />

        <SpeciesStatCard label="Aggression" value={species.temperament} />

        <SpeciesStatCard label="Lifespan" value={null} />

        <SpeciesStatCard label="Diet" value={species.diet} />

        <SpeciesStatCard label="Difficulty" value={species.care_level} />

        <SpeciesStatCard
          label="Adult Size"
          value={
            species.max_size_inches ? `${species.max_size_inches} inches` : null
          }
        />
      </section>

      <SpeciesCompatibilitySections
        currentSpeciesSlug={slug}
        compatibility={compatibility}
      />
      </PageContainer>
    </>
  );
}

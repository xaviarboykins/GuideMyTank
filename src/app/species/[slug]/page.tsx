import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { SpeciesCompatibilitySections } from "@/components/species/species-compatibility-sections";
import { SpeciesStatCard } from "@/components/species/species-stat-card";
import { PageContainer } from "@/components/site/page-container";
import { PageHeader } from "@/components/site/page-header";

import { getCompatibilityRulesForSpecies } from "@/lib/data/compatibility";
import { getSpeciesBySlug, getSpeciesSlugs } from "@/lib/data/species";
import { getSpeciesImage } from "@/lib/images";

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
    species.summary ??
    `Learn about ${species.common_name} care, tank size, pH, temperature, temperament, diet, and aquarium compatibility.`
  );
}

function formatNumber(value: number | null | undefined, suffix = "") {
  return value ? `${value}${suffix}` : null;
}

function formatRange(
  min: number | null | undefined,
  max: number | null | undefined,
  suffix = "",
) {
  if (min && max) {
    return `${min}-${max}${suffix}`;
  }

  return null;
}

function formatBoolean(value: boolean | null | undefined) {
  if (value === true) {
    return "Yes";
  }

  if (value === false) {
    return "No";
  }

  return null;
}

function formatGroupSize(species: Species) {
  if (species.schooling) {
    return species.min_group_size
      ? `${species.min_group_size}+`
      : "Group recommended";
  }

  return species.min_group_size ? `${species.min_group_size}` : "Solo/pair";
}

function formatTag(tag: string) {
  return tag
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getSpeciesJsonLd(species: Species) {
  const url = getSpeciesPageUrl(species.slug);
  const properties = [
    species.scientific_name
      ? { name: "Scientific name", value: species.scientific_name }
      : null,
    species.family ? { name: "Family", value: species.family } : null,
    species.origin ? { name: "Origin", value: species.origin } : null,
    species.region ? { name: "Region", value: species.region } : null,
    species.tank_size_gal
      ? {
          name: "Minimum tank size",
          value: `${species.tank_size_gal} gallons`,
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
    species.aggression_level
      ? { name: "Aggression level", value: `${species.aggression_level}/10` }
      : null,
    species.diet ? { name: "Diet", value: species.diet } : null,
    species.care_level
      ? { name: "Care level", value: species.care_level }
      : null,
    species.max_size_inches
      ? { name: "Adult size", value: `${species.max_size_inches} inches` }
      : null,
    species.lifespan_years
      ? { name: "Lifespan", value: `${species.lifespan_years} years` }
      : null,
    species.bioload_rating
      ? { name: "Bioload rating", value: `${species.bioload_rating}/10` }
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
      alternateName: species.scientific_name,
      description: getSpeciesDescription(species),
      additionalProperty: properties.map((property) => ({
        "@type": "PropertyValue",
        ...property,
      })),
    },
  };
}

export const revalidate = 86400;
export const dynamicParams = false;

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
  const compatibilityTags = species.compatibility_tags ?? [];
  const speciesImage = getSpeciesImage(species.slug);

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
            species.summary ??
            "Freshwater aquarium species profile with care requirements and tank planning data."
          }
        />

        <section className="mt-6">
          <div className="w-fit rounded-lg border bg-card p-4">
            <div className="flex flex-col gap-4">
              <div className="relative h-96 w-96">
                <Image
                  src={speciesImage}
                  alt={`${species.common_name} aquarium species`}
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 space-y-2">
          <p className="text-lg italic text-muted-foreground">
            {species.scientific_name}
          </p>

          {(species.family || species.origin || species.region) && (
            <p className="text-sm text-muted-foreground">
              {[species.family, species.origin, species.region]
                .filter(Boolean)
                .join(" | ")}
            </p>
          )}
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">Core Requirements</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SpeciesStatCard
              label="Tank Size"
              value={formatNumber(species.tank_size_gal, " gallons minimum")}
            />
            <SpeciesStatCard
              label="Adult Size"
              value={formatNumber(species.max_size_inches, " inches")}
            />
            <SpeciesStatCard
              label="Group Size"
              value={formatGroupSize(species)}
            />
            <SpeciesStatCard
              label="Bioload"
              value={
                species.bioload_rating ? `${species.bioload_rating}/10` : null
              }
            />
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">Water Parameters</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SpeciesStatCard
              label="Temperature"
              value={formatRange(species.min_temp_f, species.max_temp_f, " F")}
            />
            <SpeciesStatCard
              label="pH"
              value={formatRange(species.min_ph, species.max_ph)}
            />
            <SpeciesStatCard
              label="Plant Safe"
              value={formatBoolean(species.plant_safe)}
            />
            <SpeciesStatCard
              label="Invert Safe"
              value={formatBoolean(species.invert_safe)}
            />
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">Behavior & Husbandry</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SpeciesStatCard label="Temperament" value={species.temperament} />
            <SpeciesStatCard
              label="Aggression"
              value={
                species.aggression_level
                  ? `${species.aggression_level}/10`
                  : null
              }
            />
            <SpeciesStatCard label="Diet" value={species.diet} />
            <SpeciesStatCard label="Difficulty" value={species.care_level} />
            <SpeciesStatCard
              label="Lifespan"
              value={formatNumber(species.lifespan_years, " years")}
            />
            <SpeciesStatCard
              label="Breeding"
              value={species.breeding_difficulty}
            />
            <SpeciesStatCard
              label="Schooling"
              value={formatBoolean(species.schooling)}
            />
          </div>
        </section>

        {compatibilityTags.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xl font-semibold">Compatibility Tags</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {compatibilityTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded border bg-muted px-2.5 py-1 text-sm text-muted-foreground"
                >
                  {formatTag(tag)}
                </span>
              ))}
            </div>
          </section>
        )}

        <SpeciesCompatibilitySections
          currentSpeciesSlug={slug}
          compatibility={compatibility}
        />
      </PageContainer>
    </>
  );
}

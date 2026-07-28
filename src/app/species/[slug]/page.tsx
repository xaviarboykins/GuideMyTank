import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import { SpeciesCompatibilitySections } from "@/components/species/species-compatibility-sections";
import { BuilderCallToAction } from "@/components/internal-linking/builder-call-to-action";
import { InternalLinksSection } from "@/components/internal-linking/internal-links-section";
import { SpeciesStatCard } from "@/components/species/species-stat-card";
import { PageContainer } from "@/components/site/page-container";
import { PageHeader } from "@/components/site/page-header";
import { Button } from "@/components/ui/button";
import { ContentBreadcrumbs } from "@/components/content/public-content";
import { JsonLd } from "@/components/seo/json-ld";

import { getSpeciesCompatibilityData } from "@/lib/compatibility/service";
import { getPublishedCareGuideForSpecies } from "@/lib/care-guides/service";
import { getSpeciesBySlug, getSpeciesSlugs } from "@/lib/data/species";
import { getSpeciesImage, hasSpeciesImage } from "@/lib/images";
import { formatSpeciesGroupLabel } from "@/lib/species/group-label";
import { getSiteUrl } from "@/lib/seo/site-url";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { NOINDEX_NOFOLLOW } from "@/lib/seo/indexability";
import { getSpeciesPageLinks } from "@/lib/seo/internal-linking/service";
import { buildSpeciesPageEntities } from "@/lib/seo/schema/species-page";
import {
  formatRecommendedTemperature,
  formatToleratedTemperature,
  hasDifferentToleratedTemperature,
} from "@/lib/species/temperature-label";

type SpeciesPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type Species = NonNullable<Awaited<ReturnType<typeof getSpeciesBySlug>>>;
const getCachedSpeciesBySlug = cache(getSpeciesBySlug);

function getSpeciesPageUrl(slug: string) {
  return getSiteUrl(`/species/${slug}`);
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

function formatTag(tag: string) {
  return tag
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export const revalidate = 604_800; // CACHE_TTL.species
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
  const species = await getCachedSpeciesBySlug(slug);

  if (!species) {
    return buildPageMetadata({
      title: "Species Not Found",
      description: "The requested aquarium species profile could not be found.",
      path: `/species/${slug}`,
      robots: NOINDEX_NOFOLLOW,
    });
  }

  const title = `${species.common_name} Species Profile and Care Data`;
  const description = getSpeciesDescription(species);
  const url = getSpeciesPageUrl(species.slug);

  return buildPageMetadata({
    title,
    description,
    path: new URL(url).pathname,
    image: hasSpeciesImage(species.slug)
      ? {
          url: getSpeciesImage(species.slug),
          alt: `${species.common_name} aquarium species`,
        }
      : null,
  });
}

export default async function SpeciesPage({ params }: SpeciesPageProps) {
  const { slug } = await params;
  const species = await getCachedSpeciesBySlug(slug);

  if (!species) {
    notFound();
  }

  const [compatibilityData, publishedCareGuide] = await Promise.all([
    getSpeciesCompatibilityData(slug),
    getPublishedCareGuideForSpecies(species.id),
  ]);
  const internalLinks = await getSpeciesPageLinks(
    species,
    compatibilityData.candidates,
    compatibilityData.compatibility,
  );

  const speciesPath = `/species/${species.slug}`;
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Species", path: "/species" },
    { name: species.common_name, path: speciesPath },
  ];
  const schemaEntities = buildSpeciesPageEntities({
    slug: species.slug,
    name: species.common_name,
    scientificName: species.scientific_name,
    description: getSpeciesDescription(species),
    dateModified: species.updated_at,
    breadcrumbs,
  });
  const compatibilityTags = species.compatibility_tags ?? [];
  const careWarnings = species.care_warnings ?? [];
  const speciesImage = getSpeciesImage(species.slug);

  return (
    <>
      <JsonLd entities={schemaEntities} />
      <PageContainer>
        <ContentBreadcrumbs
          items={breadcrumbs}
        />
        <PageHeader
          eyebrow="PisciDex Species Profile"
          title={species.common_name}
          description={
            species.summary ??
            "Freshwater aquarium species profile with care requirements and tank planning data."
          }
          action={publishedCareGuide ? <Button asChild><Link href={`/care-guides/${publishedCareGuide.slug}`}>View complete Care Guide</Link></Button> : null}
        />

        <section className="mt-6">
          <div className="flex flex-col gap-4">
            <div className="relative aspect-[4/3] w-full max-w-sm sm:max-w-md lg:max-w-lg">
              <Image
                src={speciesImage}
                alt={`${species.common_name} aquarium species`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 520px"
                className="object-contain"
                priority
              />
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
              value={formatSpeciesGroupLabel(species)}
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
              value={formatRecommendedTemperature(species)}
            />
            {hasDifferentToleratedTemperature(species) ? (
              <SpeciesStatCard
                label="Tolerated Temp"
                value={formatToleratedTemperature(species)}
              />
            ) : null}
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
            <SpeciesStatCard
              label="Data Confidence"
              value={species.data_confidence}
            />
          </div>
          {species.temp_source_notes ? (
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Temperature note: {species.temp_source_notes}
            </p>
          ) : null}
        </section>

        {careWarnings.length > 0 ? (
          <section className="mt-8">
            <h2 className="text-xl font-semibold">Care Warnings</h2>
            <ul className="mt-4 list-disc space-y-2 rounded-lg border bg-card p-5 pl-8 text-sm leading-6 text-muted-foreground">
              {careWarnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </section>
        ) : null}

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

        <InternalLinksSection
          title="Similar Species"
          items={internalLinks.similarSpecies}
          limit={4}
        />

        <InternalLinksSection
          title="Related Articles"
          items={internalLinks.articles}
          limit={4}
        />

        <InternalLinksSection
          title="Explore This Topic"
          items={internalLinks.topicClusters}
        />

        <BuilderCallToAction item={internalLinks.builder[0]} />

        <SpeciesCompatibilitySections
          currentSpeciesSlug={slug}
          compatibility={internalLinks.remainingCompatibility}
        />
      </PageContainer>
    </>
  );
}

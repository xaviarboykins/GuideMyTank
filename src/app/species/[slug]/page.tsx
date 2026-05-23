import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageContainer } from "@/components/site/page-container";
import { PageHeader } from "@/components/site/page-header";
import { SpeciesStatCard } from "@/components/species/species-stat-card";
import { SpeciesCompatibilitySections } from "@/components/species/species-compatibility-sections";

import { getCompatibilityRulesForSpecies } from "@/lib/data/compatibility";
import { getSpeciesBySlug, getSpeciesSlugs } from "@/lib/data/species";

type SpeciesPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

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

  return {
    title: `${species.common_name} Care Guide | GuideMyTank`,
    description:
      species.short_description ??
      `Learn about ${species.common_name} care, tank size, pH, temperature, temperament, diet, and aquarium compatibility.`,
  };
}

export default async function SpeciesPage({ params }: SpeciesPageProps) {
  const { slug } = await params;
  const species = await getSpeciesBySlug(slug);
  const compatibility = await getCompatibilityRulesForSpecies(slug);

  if (!species) {
    notFound();
  }

  return (
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
  );
}

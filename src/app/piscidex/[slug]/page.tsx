import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageContainer } from "@/components/site/page-container";
import { PageHeader } from "@/components/site/page-header";
import { SpeciesStatCard } from "@/components/species/species-stat-card";

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
      `Learn about ${species.common_name} care, tank size, temperament, diet, and aquarium compatibility.`,
  };
}

export default async function SpeciesPage({ params }: SpeciesPageProps) {
  const { slug } = await params;
  const species = await getSpeciesBySlug(slug);

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

      {species.scientific_name && (
        <p className="mt-2 italic text-muted-foreground">
          {species.scientific_name}
        </p>
      )}

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SpeciesStatCard label="Temperament" value={species.temperament} />
        <SpeciesStatCard label="Care Level" value={species.care_level} />
        <SpeciesStatCard
          label="Minimum Tank"
          value={
            species.min_tank_gallons ? `${species.min_tank_gallons} gal` : null
          }
        />
        <SpeciesStatCard
          label="Max Size"
          value={
            species.max_size_inches ? `${species.max_size_inches} in` : null
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
        <SpeciesStatCard
          label="pH Range"
          value={
            species.min_ph && species.max_ph
              ? `${species.min_ph}–${species.max_ph}`
              : null
          }
        />
        <SpeciesStatCard label="Diet" value={species.diet} />
        <SpeciesStatCard label="Family" value={species.family} />
        <SpeciesStatCard label="Origin" value={species.origin_region} />
        <SpeciesStatCard
          label="Schooling"
          value={
            species.schooling
              ? `Yes, ${species.minimum_group_size}+ recommended`
              : "No"
          }
        />
      </section>
    </PageContainer>
  );
}

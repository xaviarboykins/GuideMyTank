import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
      `Learn about ${species.common_name} care, tank size, temperament, and aquarium compatibility.`,
  };
}

export default async function SpeciesPage({ params }: SpeciesPageProps) {
  const { slug } = await params;
  const species = await getSpeciesBySlug(slug);

  if (!species) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <p className="text-sm text-muted-foreground">PisciDex Species Profile</p>

      <h1 className="mt-2 text-3xl font-bold tracking-tight">
        {species.common_name}
      </h1>

      {species.scientific_name && (
        <p className="mt-1 italic text-muted-foreground">
          {species.scientific_name}
        </p>
      )}

      {species.short_description && (
        <p className="mt-4 max-w-2xl">{species.short_description}</p>
      )}

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <InfoCard label="Temperament" value={species.temperament} />
        <InfoCard label="Care Level" value={species.care_level} />
        <InfoCard
          label="Minimum Tank"
          value={`${species.min_tank_gallons} gal`}
        />
        <InfoCard label="Max Size" value={`${species.max_size_inches} in`} />
        <InfoCard
          label="Temperature"
          value={`${species.min_temp_f}–${species.max_temp_f}°F`}
        />
        <InfoCard
          label="pH Range"
          value={`${species.min_ph}–${species.max_ph}`}
        />
        <InfoCard label="Diet" value={species.diet} />
        <InfoCard
          label="Schooling"
          value={
            species.schooling ? `Yes, ${species.minimum_group_size}+` : "No"
          }
        />
      </section>
    </main>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string | number | null;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value ?? "Unknown"}</p>
    </div>
  );
}

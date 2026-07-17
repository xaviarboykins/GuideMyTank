import type { Metadata } from "next";
import Link from "next/link";

import { CompatibilityChecker } from "@/components/compatibility/compatibility-checker";
import { PageContainer } from "@/components/site/page-container";
import { DevelopmentBadge } from "@/components/site/development-badge";
import { PageHeader } from "@/components/site/page-header";
import { getAllSpecies } from "@/lib/data/species";

type CompatibilityPageProps = {
  searchParams?: Promise<{
    speciesA?: string;
    speciesB?: string;
  }>;
};

export const metadata: Metadata = {
  title:
    "Compatibility Checker | Tank Mate Compatibility Checker | GuideMyTank",
  description:
    "Compare aquarium species by temperament, size, water parameters, and care requirements.",
  alternates: {
    canonical: "https://www.guidemytank.com/compatibility",
  },
  openGraph: {
    url: "https://www.guidemytank.com/compatibility",
  },
};

export const revalidate = 86400;

export default async function CompatibilityPage({
  searchParams,
}: CompatibilityPageProps) {
  const params = await searchParams;
  const species = await getAllSpecies();

  const compatibilitySpecies = species.map((item) => ({
    slug: item.slug,
    common_name: item.common_name,
  }));

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Fish Compatibility"
        title="Compatibility Checker"
        description="Compare aquarium species by temperament, size, water parameters, and care requirements."
        badge={<DevelopmentBadge />}
      />

      <CompatibilityChecker
        species={compatibilitySpecies}
        initialSpeciesA={params?.speciesA}
        initialSpeciesB={params?.speciesB}
      />

      <section className="mt-8 rounded-lg border bg-card p-6">
        <h2 className="text-xl font-semibold">Compatibility Disclaimer</h2>

        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
          GuideMyTank compatibility scores are educational recommendations based
          on available husbandry data. They are not guarantees. Individual fish
          behavior, tank layout, stocking levels, water quality, and
          introduction methods can all affect real-world outcomes.
        </p>

        <Link
          href="/compatibility/disclaimer"
          className="mt-4 inline-flex text-sm font-medium underline-offset-4 hover:underline"
        >
          Read the full compatibility disclaimer
        </Link>
      </section>
    </PageContainer>
  );
}

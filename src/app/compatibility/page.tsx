import type { Metadata } from "next";
import Link from "next/link";

import { PageContainer } from "@/components/site/page-container";
import { PageHeader } from "@/components/site/page-header";

import { getAllSpecies } from "@/lib/data/species";

export const metadata: Metadata = {
  title:
    "Compatibility Checker | Tank Mate Compatibility Checker | GuideMyTank",
  description:
    "Compare aquarium species by temperament, size, water parameters, and care requirements.",
};

export const revalidate = 86400;

export default async function CompatibilityPage() {
  const species = await getAllSpecies();

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Fish Compatibility"
        title="Compatibility Checker"
        description="Compare aquarium species by temperament, size, water parameters, and care requirements."
      />

      <section className="mt-8 rounded-lg border bg-card">
        <div className="border-b p-4">
          <h2 className="text-lg font-semibold">Browse Compatibility Pairs</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Select species to compare aquarium compatibility.
          </p>
        </div>

        <div className="grid gap-4 p-4 sm:grid-cols-2">
          {species.map((speciesA) => (
            <div
              key={speciesA.id}
              className="rounded-md border bg-background p-4"
            >
              <h3 className="font-medium">{speciesA.common_name}</h3>

              <div className="mt-3 flex flex-wrap gap-2">
                {species
                  .filter((speciesB) => speciesB.id !== speciesA.id)
                  .map((speciesB) => (
                    <Link
                      key={speciesB.id}
                      href={`/compatibility/${speciesA.slug}/${speciesB.slug}`}
                      className="rounded-md border px-2 py-1 text-xs hover:bg-muted"
                    >
                      {speciesB.common_name}
                    </Link>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </PageContainer>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

import { PageContainer } from "@/components/site/page-container";
import { PageHeader } from "@/components/site/page-header";

import { getCompatibleSpeciesPairs } from "@/lib/data/compatibility";

const visibleCompatibilityCount = 12;

export const metadata: Metadata = {
  title:
    "Compatibility Checker | Tank Mate Compatibility Checker | GuideMyTank",
  description:
    "Compare aquarium species by temperament, size, water parameters, and care requirements.",
};

export const revalidate = 86400;

export default async function CompatibilityPage() {
  const compatibilityPairs = await getCompatibleSpeciesPairs();

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
          {compatibilityPairs.map(({ species, compatibleSpecies }) => {
            const visibleSpecies = compatibleSpecies.slice(
              0,
              visibleCompatibilityCount,
            );
            const hiddenSpecies = compatibleSpecies.slice(
              visibleCompatibilityCount,
            );

            return (
              <div
                key={species.slug}
                className="rounded-md border bg-background p-4"
              >
                <h3 className="font-medium">{species.common_name}</h3>

                {compatibleSpecies.length > 0 ? (
                  <>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {visibleSpecies.map((compatible) => (
                        <Link
                          key={compatible.slug}
                          href={`/compatibility/${species.slug}/${compatible.slug}`}
                          className="rounded-md border px-2 py-1 text-xs hover:bg-muted"
                        >
                          {compatible.common_name}
                        </Link>
                      ))}
                    </div>

                    {hiddenSpecies.length > 0 && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                          See {hiddenSpecies.length} more
                        </summary>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {hiddenSpecies.map((compatible) => (
                            <Link
                              key={compatible.slug}
                              href={`/compatibility/${species.slug}/${compatible.slug}`}
                              className="rounded-md border px-2 py-1 text-xs hover:bg-muted"
                            >
                              {compatible.common_name}
                            </Link>
                          ))}
                        </div>
                      </details>
                    )}
                  </>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">
                    No compatible species found yet.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </PageContainer>
  );
}

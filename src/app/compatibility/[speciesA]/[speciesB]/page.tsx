import { notFound } from "next/navigation";

import { PageContainer } from "@/components/site/page-container";
import { PageHeader } from "@/components/site/page-header";
import { getCompatibilityRule } from "@/lib/data/compatibility";
import { CompatibilitySummary } from "@/components/compatibility/compatibility-summary";

type CompatibilityPageProps = {
  params: Promise<{
    speciesA: string;
    speciesB: string;
  }>;
};

export const revalidate = 86400;

export default async function CompatibilityDetailPage({
  params,
}: CompatibilityPageProps) {
  const { speciesA, speciesB } = await params;

  const compatibility = await getCompatibilityRule(speciesA, speciesB);

  if (!compatibility) {
    notFound();
  }

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Compatibility Report"
        title={`${compatibility.species_a.common_name} + ${compatibility.species_b.common_name}`}
        description="Aquarium compatibility analysis between two freshwater species."
      />

      <CompatibilitySummary compatibility={compatibility} />
    </PageContainer>
  );
}

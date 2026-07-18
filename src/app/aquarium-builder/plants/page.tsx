import type { Metadata } from "next";

import { PlantsSelectionInterface } from "@/components/aquarium-builder/plants-selection-interface";
import { PageContainer } from "@/components/site/page-container";
import { PageHeader } from "@/components/site/page-header";
import { getPlants } from "@/lib/plants/service";
import { NOINDEX_FOLLOW } from "@/lib/seo/indexability";

export const metadata: Metadata = {
  title: "Plants | Aquarium Builder | GuideMyTank",
  description:
    "Manage aquatic plant selections for the GuideMyTank Aquarium Builder.",
  alternates: { canonical: "/aquarium-builder/plants" },
  robots: NOINDEX_FOLLOW,
};

export default async function AquariumBuilderPlantsPage() {
  const plants = await getPlants();

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Aquarium Builder"
        title="Plants"
        description="Search the freshwater plant catalog and manage plants selected for this aquarium."
      />

      <PlantsSelectionInterface plants={plants} />
    </PageContainer>
  );
}

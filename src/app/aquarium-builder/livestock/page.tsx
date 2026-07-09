import type { Metadata } from "next";

import { LivestockSelectionInterface } from "@/components/aquarium-builder/livestock-selection-interface";
import { PageContainer } from "@/components/site/page-container";
import { PageHeader } from "@/components/site/page-header";
import { getAllSpecies } from "@/lib/data/species";

export const metadata: Metadata = {
  title: "Livestock | Aquarium Builder | GuideMyTank",
  description:
    "Search aquarium species and manage living animal selections for the GuideMyTank Aquarium Builder.",
};

export default async function AquariumBuilderLivestockPage() {
  const species = await getAllSpecies();

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Aquarium Builder"
        title="Livestock"
        description="Search GuideMyTank species and manage the living animals planned for this aquarium."
      />

      <LivestockSelectionInterface species={species} />
    </PageContainer>
  );
}

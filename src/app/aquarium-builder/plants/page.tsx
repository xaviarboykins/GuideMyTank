import type { Metadata } from "next";

import { PlantsSelectionInterface } from "@/components/aquarium-builder/plants-selection-interface";
import { PageContainer } from "@/components/site/page-container";
import { PageHeader } from "@/components/site/page-header";

export const metadata: Metadata = {
  title: "Plants | Aquarium Builder | GuideMyTank",
  description:
    "Manage aquatic plant selections for the GuideMyTank Aquarium Builder.",
};

export default function AquariumBuilderPlantsPage() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Aquarium Builder"
        title="Plants"
        description="Browse and manage aquatic plants for this aquarium. Plant database support is not connected yet."
      />

      <PlantsSelectionInterface />
    </PageContainer>
  );
}

import type { Metadata } from "next";

import { AquariumBuilderInterface } from "@/components/aquarium-builder/aquarium-builder-interface";
import { DevelopmentBadge } from "@/components/site/development-badge";
import { PageContainer } from "@/components/site/page-container";
import { PageHeader } from "@/components/site/page-header";
import { getAllSpecies } from "@/lib/data/species";

export const metadata: Metadata = {
  title: "Aquarium Builder | Tank Planning Tool | GuideMyTank",
  description:
    "Plan a freshwater aquarium build with tank, equipment, plants, livestock, and compatibility placeholders.",
};

export default async function AquariumBuilderPage() {
  const species = await getAllSpecies();

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Tank Planning"
        title="Aquarium Builder"
        description="Plan a freshwater aquarium by choosing a tank, equipment, plants, livestock, and decor."
        badge={<DevelopmentBadge />}
      />

      <AquariumBuilderInterface species={species} />
    </PageContainer>
  );
}

import type { Metadata } from "next";

import { AquariumBuilderInterface } from "@/components/aquarium-builder/aquarium-builder-interface";
import { BetaBadge } from "@/components/site/beta-badge";
import { PageContainer } from "@/components/site/page-container";
import { PageHeader } from "@/components/site/page-header";
import { getAllSpecies } from "@/lib/data/species";
import { getPlants } from "@/lib/plants/service";

export const metadata: Metadata = {
  title: "Aquarium Builder | Tank Planning Tool | GuideMyTank",
  description:
    "Plan a freshwater aquarium with equipment, plants, livestock, stocking, compatibility, heating, and build-health analysis.",
  alternates: {
    canonical: "https://www.guidemytank.com/aquarium-builder",
  },
  openGraph: {
    url: "https://www.guidemytank.com/aquarium-builder",
  },
};

export default async function AquariumBuilderPage() {
  const [species, plants] = await Promise.all([getAllSpecies(), getPlants()]);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Tank Planning"
        title="Aquarium Builder"
        description="Plan a freshwater aquarium by choosing a tank, equipment, plants, livestock, and decor."
        badge={<BetaBadge />}
      />

      <AquariumBuilderInterface plantCatalog={plants} species={species} />
    </PageContainer>
  );
}

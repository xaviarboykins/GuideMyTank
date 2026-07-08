import type { Metadata } from "next";

import { AquariumBuilderInterface } from "@/components/aquarium-builder/aquarium-builder-interface";
import { PageContainer } from "@/components/site/page-container";
import { PageHeader } from "@/components/site/page-header";

export const metadata: Metadata = {
  title: "Aquarium Builder | Tank Planning Tool | GuideMyTank",
  description:
    "Plan a freshwater aquarium build with tank, equipment, plants, livestock, and compatibility placeholders.",
};

export default function AquariumBuilderPage() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Tank Planning"
        title="Aquarium Builder"
        description="Plan a freshwater aquarium by choosing a tank, equipment, plants, livestock, and decor. This first version is a layout foundation for the builder workflow."
      />

      <AquariumBuilderInterface />
    </PageContainer>
  );
}

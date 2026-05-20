import type { Metadata } from "next";

import { PageContainer } from "@/components/site/page-container";
import { PageHeader } from "@/components/site/page-header";

export const metadata: Metadata = {
  title: "PisciDex | Freshwater Fish Species Database | GuideMyTank",
  description:
    "Browse freshwater aquarium fish species, care requirements, tank size, temperament, diet, and compatibility data.",
};

export default function PisciDexPage() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Species Database"
        title="PisciDex"
        description="Browse freshwater fish species, tank requirements, temperament data, care level, diet, and compatibility information."
      />
    </PageContainer>
  );
}

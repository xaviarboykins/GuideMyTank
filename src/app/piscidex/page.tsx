import type { Metadata } from "next";

import { PageContainer } from "@/components/site/page-container";
import { PageHeader } from "@/components/site/page-header";

import { getAllSpecies } from "@/lib/data/species";

import { SpeciesTable } from "@/components/species/species-table";

export const metadata: Metadata = {
  title: "PisciDex | Freshwater Fish Species Database | GuideMyTank",
  description:
    "Browse freshwater aquarium fish species, care requirements, tank size, temperament, diet, and compatibility data.",
};

export const revalidate = 86400;

export default async function PisciDexPage() {
  const species = await getAllSpecies();

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Species Database"
        title="PisciDex"
        description="Browse freshwater fish species, tank requirements, temperament data, care level, diet, and compatibility information."
      />

      <div className="mt-8 overflow-x-auto rounded-lg border">
        <SpeciesTable species={species} />
      </div>
    </PageContainer>
  );
}

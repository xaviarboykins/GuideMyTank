import { PageContainer } from "@/components/site/page-container";
import { PageHeader } from "@/components/site/page-header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Compatibility Checker | Tank Mate Compatibility Checker | GuideMyTank",
  description:
    "Compare aquarium species by temperament, size, water parameters, and care requirements.",
};

export default function CompatibilityPage() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Fish Compatibility"
        title="Compatibility Checker"
        description="Compare aquarium species by temperament, size, water parameters, and care requirements."
      />
    </PageContainer>
  );
}

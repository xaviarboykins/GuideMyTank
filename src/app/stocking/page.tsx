import { PageContainer } from "@/components/site/page-container";
import { PageHeader } from "@/components/site/page-header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stocking Planner | Fish Tank Stocking | GuideMyTank",
  description:
    "Estimate stocking levels and plan balanced freshwater aquarium communities.",
};

export default function StockingPage() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Tank Stocking"
        title="Stocking Planner"
        description="Estimate stocking levels and plan balanced freshwater aquarium communities."
      />
    </PageContainer>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

import { PageContainer } from "@/components/site/page-container";
import { PageHeader } from "@/components/site/page-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Aquarium Learning Center | GuideMyTank",
  description:
    "The GuideMyTank Learning Center is being prepared as a home for practical freshwater aquarium education.",
  alternates: {
    canonical: "https://www.guidemytank.com/learning-center",
  },
};

export default function LearningCenterPage() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Aquarium Education"
        title="Learning Center"
        description="A practical freshwater aquarium education library is coming soon."
      />

      <section className="mt-6 border border-border bg-card p-6 md:p-8">
        <h2 className="text-xl font-semibold">More learning resources are on the way</h2>
        <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
          We are preparing clear guides for aquarium setup, maintenance, water
          quality, equipment, plants, and responsible livestock planning. In
          the meantime, use the existing species care guides and planning tools.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/care-guides">Browse Care Guides</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/aquarium-builder">Open Aquarium Builder</Link>
          </Button>
        </div>
      </section>
    </PageContainer>
  );
}

import Link from "next/link";

import { ContentSection } from "@/components/site/content-section";
import { PageContainer } from "@/components/site/page-container";
import { PageHeader } from "@/components/site/page-header";

export const metadata = {
  title: "About | GuideMyTank",
  description:
    "Learn about GuideMyTank, a freshwater aquarium planning tool focused on stocking guidance, compatibility planning, and data-driven fishkeeping.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="About GuideMyTank"
        title="Smarter Freshwater Aquarium Planning"
        description="GuideMyTank helps freshwater aquarium hobbyists make better stocking and compatibility decisions before problems happen."
      />

      <ContentSection title="Why GuideMyTank Exists">
        <div className="space-y-4">
          <p>
            GuideMyTank is an independently operated freshwater aquarium
            reference and planning service. It was created to make species
            research, stocking decisions, and compatibility risks easier to
            evaluate before livestock is added to an aquarium.
          </p>
          <p>
            The site is operated under the GuideMyTank name. The operator does
            not publish a personal name or home address for privacy. Questions,
            corrections, and business inquiries can be sent through the{" "}
            <Link href="/contact" className="underline underline-offset-4">
              Contact page
            </Link>
            .
          </p>
        </div>
      </ContentSection>

      <ContentSection title="Data-Driven Stocking Guidance">
        <p>
          The goal is to help hobbyists compare species requirements, tank
          needs, temperament, schooling behavior, and compatibility risks in one
          place.
        </p>
      </ContentSection>

      <ContentSection title="Reducing Livestock Loss">
        <p>
          Poor stocking choices can lead to stress, aggression, disease, and
          livestock loss. GuideMyTank is designed to help aquarists plan before
          adding new fish.
        </p>
      </ContentSection>

      <ContentSection title="Building Trust">
        <div className="space-y-4">
          <p>
            GuideMyTank separates human-reviewed educational content from
            automated compatibility analysis. Care guides and learning-center
            articles are edited before publication and list references when
            outside sources support the material. Compatibility reports are
            calculated from structured species records and documented safety
            rules; they are planning aids, not guarantees about individual fish.
          </p>
          <p>
            Read the{" "}
            <Link href="/editorial-policy" className="underline underline-offset-4">
              Editorial Policy
            </Link>{" "}
            for the research, review, sourcing, image, and correction process.
            The{" "}
            <Link href="/compatibility/disclaimer" className="underline underline-offset-4">
              compatibility methodology
            </Link>{" "}
            explains how automated reports are produced and where their limits
            apply.
          </p>
        </div>
      </ContentSection>
    </PageContainer>
  );
}

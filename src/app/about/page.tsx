import { ContentSection } from "@/components/site/content-section";
import { PageContainer } from "@/components/site/page-container";
import { PageHeader } from "@/components/site/page-header";

export const metadata = {
  title: "About | GuideMyTank",
  description:
    "Learn about GuideMyTank, a freshwater aquarium planning tool focused on stocking guidance, compatibility planning, and data-driven fishkeeping.",
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
        <p>
          GuideMyTank was built from a passion for the aquarium hobby and a
          desire to make fishkeeping planning easier, clearer, and more
          data-driven.
        </p>
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
        <p>
          GuideMyTank aims to provide useful, transparent, and practical
          freshwater aquarium information while encouraging users to verify
          important decisions through multiple trusted sources.
        </p>
      </ContentSection>
    </PageContainer>
  );
}

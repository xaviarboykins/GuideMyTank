import { ContentSection } from "@/components/site/content-section";
import { PageContainer } from "@/components/site/page-container";
import { PageHeader } from "@/components/site/page-header";

export const metadata = {
  title: "Disclaimer | GuideMyTank",
  description:
    "GuideMyTank disclaimer for aquarium compatibility data, fish behavior, stocking recommendations, and informational content.",
};

export default function DisclaimerPage() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Legal"
        title="Disclaimer"
        description="GuideMyTank provides aquarium guidance, but aquarium outcomes can vary."
      />

      <ContentSection title="Compatibility Data">
        <p>
          Compatibility data may not always be accurate, complete, or applicable
          to every aquarium setup.
        </p>
      </ContentSection>

      <ContentSection title="Fish Behavior Varies">
        <p>
          Fish behavior can vary by individual, environment, tank size, water
          quality, sex ratio, age, stress level, and other species in the
          aquarium.
        </p>
      </ContentSection>

      <ContentSection title="Informational Recommendations">
        <p>
          GuideMyTank recommendations are informational only and should be used
          as one part of your aquarium planning process.
        </p>
      </ContentSection>

      <ContentSection title="No Guaranteed Outcomes">
        <p>
          GuideMyTank does not guarantee aquarium health, compatibility,
          breeding success, survival rates, or any other outcome.
        </p>
      </ContentSection>
    </PageContainer>
  );
}

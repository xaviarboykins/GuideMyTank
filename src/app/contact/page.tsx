import { ContentSection } from "@/components/site/content-section";
import { PageContainer } from "@/components/site/page-container";
import { PageHeader } from "@/components/site/page-header";

export const metadata = {
  title: "Contact | GuideMyTank",
  description:
    "Contact GuideMyTank for feedback, corrections, aquarium data questions, or partnership inquiries.",
};

export default function ContactPage() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Contact"
        title="Contact GuideMyTank"
        description="Have feedback, a correction, or a question about GuideMyTank? Reach out using the contact information below."
      />

      <ContentSection title="Contact Information">
        <p>
          For now, please contact GuideMyTank at:{" "}
          <span className="font-medium">contact@guidemytank.com</span>
        </p>
      </ContentSection>

      <ContentSection title="What to Send">
        <p>
          You can send species data corrections, compatibility feedback, general
          questions, business inquiries, or partnership requests.
        </p>
      </ContentSection>
    </PageContainer>
  );
}

import { ContentSection } from "@/components/site/content-section";
import { PageContainer } from "@/components/site/page-container";
import { PageHeader } from "@/components/site/page-header";

export const metadata = {
  title: "Terms of Service | GuideMyTank",
  description:
    "GuideMyTank terms of service for using aquarium planning tools, compatibility information, and site content.",
};

export default function TermsPage() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Legal"
        title="Terms of Service"
        description="By using GuideMyTank, you agree to use the site and its information responsibly."
      />

      <ContentSection title="Informational Purposes Only">
        <p>
          GuideMyTank provides aquarium information and planning tools for
          informational purposes only. Content on this site should not be
          treated as professional, veterinary, or guaranteed advice.
        </p>
      </ContentSection>

      <ContentSection title="No Guarantees">
        <p>
          GuideMyTank does not guarantee that any stocking choice, compatibility
          result, or aquarium recommendation will produce a specific outcome.
        </p>
      </ContentSection>

      <ContentSection title="Verify Independently">
        <p>
          Users should verify important aquarium decisions independently through
          trusted sources, experienced aquarists, aquatic professionals, or
          veterinarians when appropriate.
        </p>
      </ContentSection>

      <ContentSection title="Use at Your Own Risk">
        <p>
          You are responsible for your aquarium decisions, livestock purchases,
          tank conditions, and care practices. Use GuideMyTank at your own risk.
        </p>
      </ContentSection>
    </PageContainer>
  );
}

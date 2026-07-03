import { ContentSection } from "@/components/site/content-section";
import { PageContainer } from "@/components/site/page-container";
import { PageHeader } from "@/components/site/page-header";

export const metadata = {
  title: "Affiliate Disclosure | GuideMyTank",
  description:
    "GuideMyTank affiliate disclosure for qualifying purchases, affiliate links, and future affiliate partnerships.",
};

export default function AffiliateDisclosurePage() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Legal"
        title="Affiliate Disclosure"
        description="GuideMyTank may use affiliate links to support the site and future aquarium tools."
      />

      <ContentSection title="Affiliate Links">
        <p>
          GuideMyTank may earn commissions from qualifying purchases through
          affiliate links at no additional cost to you.
        </p>
      </ContentSection>

      <ContentSection title="Amazon Associate Disclosure">
        <p>
          As an Amazon Associate, GuideMyTank earns from qualifying purchases.
        </p>
      </ContentSection>

      <ContentSection title="Future Affiliate Programs">
        <p>
          GuideMyTank may participate in additional affiliate programs in the
          future. Affiliate relationships do not guarantee that a product,
          service, or recommendation is suitable for every aquarium.
        </p>
      </ContentSection>
    </PageContainer>
  );
}

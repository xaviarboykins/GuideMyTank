import { ContentSection } from "@/components/site/content-section";
import { PageContainer } from "@/components/site/page-container";
import { PageHeader } from "@/components/site/page-header";

export const metadata = {
  title: "Privacy Policy | GuideMyTank",
  description:
    "Learn how GuideMyTank collects, uses, and protects information related to analytics, cookies, advertising, affiliate links, and external links.",
};

export default function PrivacyPage() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Legal"
        title="Privacy Policy"
        description="This Privacy Policy explains how GuideMyTank may collect and use information when you visit or interact with the site."
      />

      <ContentSection title="Information We Collect">
        <p>
          GuideMyTank may collect basic usage information such as pages visited,
          browser type, device type, referring pages, approximate location data,
          and interactions with site features.
        </p>
      </ContentSection>

      <ContentSection title="Analytics, Cookies, and Tracking">
        <p>
          We may use Google Analytics and similar tools to understand site
          traffic, improve content, and measure performance. These tools may use
          cookies or browser/device identifiers.
        </p>
      </ContentSection>

      <ContentSection title="Advertising and Affiliate Links">
        <p>
          GuideMyTank may display third-party advertising, including future
          Google AdSense ads, and may participate in affiliate programs.
          Personalized ads may use cookies or similar technologies.
        </p>
      </ContentSection>

      <ContentSection title="External Links">
        <p>
          GuideMyTank may link to third-party websites. We are not responsible
          for the privacy practices, content, or policies of external sites.
        </p>
      </ContentSection>

      <ContentSection title="Contact">
        <p>
          For privacy questions, please contact GuideMyTank through the contact
          information provided on the Contact page.
        </p>
      </ContentSection>
    </PageContainer>
  );
}

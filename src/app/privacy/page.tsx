import Link from "next/link";

import { ContentSection } from "@/components/site/content-section";
import { PageContainer } from "@/components/site/page-container";
import { PageHeader } from "@/components/site/page-header";

export const metadata = {
  title: "Privacy Policy | GuideMyTank",
  description:
    "Learn how GuideMyTank collects, uses, and protects information related to analytics, cookies, advertising, affiliate links, and external links.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Legal"
        title="Privacy Policy"
        description="This Privacy Policy explains how GuideMyTank collects and uses information when you visit or interact with the site. Last updated August 3, 2026."
      />

      <ContentSection title="Information We Collect">
        <p>
          GuideMyTank may collect basic usage information such as pages visited,
          browser type, device type, referring pages, approximate location data,
          and interactions with site features. If you use an authenticated area,
          essential session cookies may also be used to keep you signed in and
          protect the service.
        </p>
      </ContentSection>

      <ContentSection title="Analytics, Cookies, and Tracking">
        <div className="space-y-4">
          <p>
            GuideMyTank uses Google Analytics to understand site traffic,
            improve content and utilities, diagnose performance, and measure how
            visitors use the site. Depending on your location and consent
            choices, Google Analytics may use cookies, local storage, or
            browser and device identifiers.
          </p>
          <p>
            GuideMyTank uses Google&apos;s consent management platform and Consent
            Mode to communicate applicable choices for advertising storage,
            advertising personalization, advertising user data, and analytics
            storage. Declining optional consent does not prevent access to the
            site&apos;s primary public content and aquarium tools.
          </p>
        </div>
      </ContentSection>

      <ContentSection title="Google AdSense Advertising">
        <div className="space-y-4">
          <p>
            GuideMyTank uses Google AdSense to display a limited number of
            third-party advertisements on eligible content pages. Google and
            its advertising partners may use cookies, local storage, device
            identifiers, IP-derived location, and information about visits or
            interactions to deliver, limit, personalize, and measure ads,
            prevent fraud, and report advertising performance.
          </p>
          <p>
            Depending on your location and choices, ads may be personalized or
            non-personalized. Non-personalized ads can still use limited data
            for contextual selection, frequency capping, aggregated reporting,
            fraud prevention, and security. Learn more about how Google uses
            information from sites that use its services in the{" "}
            <a
              href="https://policies.google.com/technologies/partner-sites"
              rel="noreferrer"
              target="_blank"
              className="underline"
            >
              Google partner-sites disclosure
            </a>
            .
          </p>
          <p>
            You can review Google&apos;s advertising controls at{" "}
            <a
              href="https://myadcenter.google.com/"
              rel="noreferrer"
              target="_blank"
              className="underline"
            >
              My Ad Center
            </a>
            . GuideMyTank may also participate in affiliate programs; affiliate
            relationships are described in the{" "}
            <Link href="/affiliate-disclosure" className="underline">
              Affiliate Disclosure
            </Link>
            .
          </p>
        </div>
      </ContentSection>

      <ContentSection title="Regional Privacy Choices">
        <div className="space-y-4">
          <p>
            Visitors in the European Economic Area, United Kingdom, and
            Switzerland may be shown options to consent, not consent, or manage
            individual purposes and vendors before optional advertising and
            analytics processing occurs where required.
          </p>
          <p>
            Visitors in supported U.S. states may use the “Do Not Sell or Share
            My Personal Information” control provided on the site to submit an
            applicable opt-out choice. Google&apos;s privacy and cookie settings
            control can be used to review or change an earlier choice when it is
            available for your region.
          </p>
        </div>
      </ContentSection>

      <ContentSection title="Data Sharing and Retention">
        <p>
          Information may be processed by service providers that support
          analytics, advertising, authentication, hosting, security, and site
          operations. Retention periods vary by service, data category,
          configuration, legal obligation, and operational need. GuideMyTank
          does not ask visitors to provide sensitive personal information in
          order to use its public aquarium tools.
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
          For privacy questions or requests, contact GuideMyTank through the{" "}
          <Link href="/contact" className="underline">
            Contact page
          </Link>
          . Privacy rights and available request methods vary by location. This
          policy describes GuideMyTank&apos;s current implementation and is not a
          substitute for jurisdiction-specific legal advice.
        </p>
      </ContentSection>
    </PageContainer>
  );
}

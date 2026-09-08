import Link from "next/link";
import type { ReactNode } from "react";

import { PageContainer } from "@/components/site/page-container";

export const metadata = {
  title: "Privacy Policy | GuideMyTank",
  description:
    "Learn how GuideMyTank collects, uses, and protects information related to analytics, cookies, advertising, affiliate links, and external links.",
  alternates: { canonical: "/privacy" },
};

function PrivacySection({
  title,
  children,
}: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <section className="border-t border-border py-8 first:border-t-0">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-4 space-y-4 leading-7 text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <PageContainer>
      <article className="mx-auto max-w-4xl">
        <header className="py-4 sm:py-8">
          <p className="text-sm font-medium text-muted-foreground">Legal</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-4 max-w-3xl leading-7 text-muted-foreground">
            This Privacy Policy explains how GuideMyTank collects, uses, and
            shares information when you visit or interact with the site.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Effective September 8, 2026
          </p>
        </header>

        <aside className="border-y border-border py-6" aria-labelledby="privacy-summary">
          <h2 id="privacy-summary" className="text-lg font-semibold">
            Privacy at a glance
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 leading-7 text-muted-foreground">
            <li>GuideMyTank does not sell your personal information.</li>
            <li>
              Google Analytics helps us understand and improve use of the site.
            </li>
            <li>
              Google and its advertising partners may use cookies and similar
              technologies to provide and measure advertising.
            </li>
            <li>
              Where required, you can consent, decline, or manage optional data
              processing through the privacy controls shown on the site.
            </li>
            <li>
              You can contact us to ask a privacy question or exercise an
              applicable privacy right.
            </li>
          </ul>
        </aside>

      <PrivacySection title="About GuideMyTank">
        <div className="space-y-4">
          <p>
            GuideMyTank is an independently owned and operated sole
            proprietorship. In this policy, “GuideMyTank,” “we,” “us,” and
            “our” refer to the operator of guidemytank.com. GuideMyTank
            determines why and how personal information under its control is
            processed. Third-party services may separately process information
            under their own terms and privacy policies.
          </p>
          <p>
            GuideMyTank provides public aquarium information, care guides,
            comparison guides, articles, calculators, and planning tools. You
            do not need to create a public user account or provide your name to
            use the site&apos;s public content and tools.
          </p>
        </div>
      </PrivacySection>

      <PrivacySection title="Information We Collect">
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground">
            Information collected automatically
          </h3>
          <p>
            GuideMyTank and its service providers may automatically receive
            information such as the page URL you visit, your IP address,
            approximate location derived from your IP address, browser and
            device information, operating system, referring page, access time,
            interactions with site features, cookie identifiers, and
            advertising identifiers where applicable.
          </p>
          <h3 className="font-semibold text-foreground">
            Information you provide
          </h3>
          <p>
            If you contact GuideMyTank, we receive your email address and the
            information you choose to include in your message, together with
            basic delivery and response metadata. Please do not send sensitive
            personal information through the contact form or email.
          </p>
          <h3 className="font-semibold text-foreground">
            Aquarium Builder information
          </h3>
          <p>
            Aquarium Builder selections, such as tank details, livestock,
            plants, and equipment, are saved in your browser&apos;s local storage so
            you can return to a build. GuideMyTank does not receive this
            information merely because it is stored locally on your device.
            Clearing site data in your browser removes the locally saved build.
          </p>
          <h3 className="font-semibold text-foreground">
            Authentication and administrative information
          </h3>
          <p>
            GuideMyTank&apos;s restricted administrative area uses Supabase
            authentication. For an authorized administrator, this may involve
            an email address, authentication records, security events, and
            essential session tokens. This administrative authentication is
            not a public visitor account system.
          </p>
          <h3 className="font-semibold text-foreground">
            Analytics, advertising, and consent information
          </h3>
          <p>
            Depending on your location and choices, Google services may process
            cookie or device identifiers, consent selections, page and session
            activity, ad impressions and interactions, approximate location,
            and browser or device information. We receive analytics and
            advertising reports that are generally aggregated rather than a
            profile containing a visitor&apos;s name.
          </p>
        </div>
      </PrivacySection>

      <PrivacySection title="How We Use Information">
        <ul className="list-disc space-y-2 pl-5">
          <li>Provide articles, guides, comparisons, calculators, and tools.</li>
          <li>Save Aquarium Builder selections locally on your device.</li>
          <li>Operate, maintain, troubleshoot, and secure the site.</li>
          <li>
            Understand traffic and feature usage and improve content,
            navigation, accessibility, and performance.
          </li>
          <li>Respond to questions, feedback, and privacy requests.</li>
          <li>Detect, investigate, and prevent fraud, abuse, and security incidents.</li>
          <li>
            Select, deliver, limit, and measure contextual or personalized
            advertising where permitted by law and your choices.
          </li>
          <li>Maintain consent records and apply privacy preferences.</li>
          <li>
            Comply with legal obligations and establish, exercise, or defend
            legal claims.
          </li>
        </ul>
      </PrivacySection>

      <PrivacySection title="Legal Bases for Processing">
        <div className="space-y-4">
          <p>
            Where the GDPR, UK GDPR, or similar law applies, GuideMyTank relies
            on one or more of the following legal bases. The applicable basis
            depends on the information, purpose, and circumstances.
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-foreground">Consent:</strong> for optional
              analytics storage, advertising storage, ad personalization, and
              advertising user data where consent is required. You may withdraw
              consent at any time through the site&apos;s privacy controls. This
              does not affect processing that occurred before withdrawal.
            </li>
            <li>
              <strong className="text-foreground">Legitimate interests:</strong>{" "}
              to operate and improve the site, understand aggregate usage,
              maintain security, prevent abuse, and respond to ordinary
              communications where those interests are not overridden by your
              rights and interests.
            </li>
            <li>
              <strong className="text-foreground">Legal obligations:</strong> to
              retain or disclose information when applicable law requires it
              and to respond to valid legal process.
            </li>
            <li>
              <strong className="text-foreground">
                Performance of a contract or steps at your request:
              </strong>{" "}
              when processing is necessary to provide a service you requested
              or respond before entering an agreement, if applicable.
            </li>
          </ul>
          <p>
            When GuideMyTank relies on legitimate interests, we consider the
            necessity of the processing, its likely effects, and reasonable
            safeguards. You may object to processing based on legitimate
            interests as described under Regional Privacy Rights.
          </p>
        </div>
      </PrivacySection>

      <PrivacySection title="Analytics, Cookies, and Similar Technologies">
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
          <p>
            You can control cookies through your browser settings. You can also
            learn about and install the{" "}
            <a
              href="https://tools.google.com/dlpage/gaoptout"
              rel="noreferrer"
              target="_blank"
              className="underline"
            >
              Google Analytics Opt-out Browser Add-on
            </a>
            . Blocking or deleting cookies may affect certain site features or
            require you to make privacy choices again.
          </p>
        </div>
      </PrivacySection>

      <PrivacySection title="Cookies and Browser Storage We Use">
        <div className="space-y-4">
          <p>
            The following names and patterns describe storage used by the
            current site implementation. A name containing angle brackets is a
            pattern whose identifier is generated for the applicable Google or
            Supabase project. Provider-controlled names and retention periods
            can change as those services or their configuration change.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border text-foreground">
                  <th className="py-3 pr-4 font-semibold">Name or pattern</th>
                  <th className="py-3 pr-4 font-semibold">Type</th>
                  <th className="py-3 font-semibold">Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="py-3 pr-4 font-mono text-xs">_ga</td>
                  <td className="py-3 pr-4">Google Analytics cookie</td>
                  <td className="py-3">
                    Distinguishes users for analytics. Google&apos;s default
                    expiration is two years, subject to browser limits and the
                    site&apos;s consent configuration.
                  </td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-mono text-xs">
                    _ga_&lt;container-id&gt;
                  </td>
                  <td className="py-3 pr-4">Google Analytics cookie</td>
                  <td className="py-3">
                    Persists session state. Google&apos;s default expiration is two
                    years, subject to browser limits and the site&apos;s consent
                    configuration.
                  </td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-mono text-xs">
                    sb-&lt;project-reference&gt;-auth-token
                  </td>
                  <td className="py-3 pr-4">Essential Supabase cookie</td>
                  <td className="py-3">
                    Maintains an authorized administrator&apos;s authenticated
                    session. Large values may be divided into numbered cookie
                    chunks using the same name pattern.
                  </td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-mono text-xs">
                    guidemytank:aquarium-builder
                  </td>
                  <td className="py-3 pr-4">First-party local storage</td>
                  <td className="py-3">
                    Saves Aquarium Builder tank, livestock, plant, and equipment
                    selections in the visitor&apos;s browser until cleared.
                  </td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-mono text-xs">
                    guidemytank:cookie-consent
                  </td>
                  <td className="py-3 pr-4">Consent preference local storage</td>
                  <td className="py-3">
                    Remembers whether a visitor allowed or declined optional
                    analytics until the choice or browser site data is cleared.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            Google AdSense and the Google consent platform may set or access
            additional first- or third-party cookies and identifiers when their
            tags run. Advertising cookies may be associated with Google domains
            such as doubleclick.net or google.com. Because the applicable
            vendors and cookie names depend on region, consent, browser, and ad
            configuration, the Google consent panel shown on the site is the
            current source for participating vendors and purposes.
          </p>
          <p>
            You can delete or block browser storage in your browser settings.
            Essential authentication storage is used only for the restricted
            administrative area. Optional Google analytics and advertising
            storage is controlled by the consent choices available in your
            region.
          </p>
        </div>
      </PrivacySection>

      <PrivacySection title="Google AdSense Advertising">
        <div className="space-y-4">
          <p>
            GuideMyTank uses Google AdSense to display a limited number of
            third-party advertisements on eligible content pages. Google and
            other third-party advertising partners may place and read cookies in
            your browser or use web beacons, IP addresses, local storage, device
            identifiers, and information about visits or interactions as a
            result of ad serving on this site. These technologies may be used to
            deliver and limit ads, select contextual or personalized ads where
            permitted, measure advertising, prevent fraud and abuse, maintain
            security, and report advertising performance.
          </p>
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">
              Advertising cookies and third-party vendors
            </h3>
            <p>
              Third-party vendors, including Google, use cookies to serve ads
              based on a visitor&apos;s prior visits to GuideMyTank or other
              websites. Google&apos;s use of advertising cookies enables Google and
              its partners to serve ads based on visits to GuideMyTank and other
              sites on the Internet.
            </p>
            <p>
              Other third-party vendors and ad networks may also use cookies to
              serve ads on GuideMyTank. The vendors involved may vary. Visitors
              can review the vendors presented through the site&apos;s Google consent
              controls and learn more about Google&apos;s{" "}
              <a
                href="https://support.google.com/admanager/answer/94149"
                rel="noreferrer"
                target="_blank"
                className="underline"
              >
                certified third-party advertising vendors
              </a>
              . Where a vendor provides an opt-out mechanism, visitors may use
              that vendor&apos;s website to opt out of personalized advertising.
            </p>
            <p>
              Visitors may opt out of personalized advertising from Google in{" "}
              <a
                href="https://myadcenter.google.com/"
                rel="noreferrer"
                target="_blank"
                className="underline"
              >
                My Ad Center
              </a>
              . Visitors may also opt out of some participating third-party
              vendors&apos; uses of cookies for personalized advertising through{" "}
              <a
                href="https://optout.aboutads.info/"
                rel="noreferrer"
                target="_blank"
                className="underline"
              >
                WebChoices
              </a>
              .
            </p>
          </div>
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
            GuideMyTank may also participate in affiliate programs; affiliate
            relationships are described in the{" "}
            <Link href="/affiliate-disclosure" className="underline">
              Affiliate Disclosure
            </Link>
            .
          </p>
        </div>
      </PrivacySection>

      <PrivacySection title="Regional Privacy Rights and Choices">
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
          <p>
            Depending on your location and applicable law, your rights may
            include the following:
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Request confirmation of whether personal information is processed
              and obtain access to it and certain processing details.
            </li>
            <li>Request correction of inaccurate or incomplete information.</li>
            <li>
              Request deletion of information, subject to legal and operational
              exceptions.
            </li>
            <li>
              Receive certain information in a structured, commonly used,
              machine-readable format and request its transfer where applicable.
            </li>
            <li>Request restriction of certain processing.</li>
            <li>
              Object to processing based on legitimate interests or for direct
              marketing.
            </li>
            <li>
              Withdraw consent at any time when processing relies on consent.
            </li>
            <li>
              Opt out of qualifying sales, sharing, targeted advertising, or
              profiling that produces legal or similarly significant effects.
            </li>
            <li>
              Receive equal service and not be unlawfully discriminated against
              for exercising a privacy right.
            </li>
            <li>
              Appeal a denial of a request where applicable and complain to a
              data protection authority or state regulator.
            </li>
          </ul>
          <p>
            GuideMyTank may need enough information to verify your identity and
            locate relevant records before completing a request. An authorized
            agent may submit a request where permitted, but we may ask for proof
            of authority and direct identity verification. We will respond
            within the period required by applicable law and explain any
            applicable denial or extension. These rights are subject to legal
            exceptions, and GuideMyTank may retain information when required or
            permitted by law.
          </p>
          <p>
            To exercise a right, email us or use the Contact page listed below.
            If you are in the EEA or UK, you may also lodge a complaint with the
            supervisory authority in the country where you live or work or
            where you believe a violation occurred.
          </p>
        </div>
      </PrivacySection>

      <PrivacySection title="Data Sharing and Retention">
        <div className="space-y-4">
          <p>
            Information may be shared with or processed by service providers
            that support analytics, advertising, authentication, hosting,
            security, and site operations. Information may also be disclosed
            when reasonably necessary to comply with law, enforce site terms,
            protect rights or safety, investigate abuse, or complete a business
            transaction involving the site.
          </p>
          <p>
            GuideMyTank retains information only for as long as reasonably
            necessary for the purposes described in this policy, including
            security, operational, and legal needs. Retention varies according
            to the data category and purpose. Third-party providers, including
            Google, maintain information according to their own settings and
            retention policies. GuideMyTank does not ask visitors to provide
            sensitive personal information to use its public aquarium tools.
          </p>
        </div>
      </PrivacySection>

      <PrivacySection title="International Data Processing and Transfers">
        <div className="space-y-4">
          <p>
            GuideMyTank is available internationally. Google, Vercel, Supabase,
            and other service providers may process or store information in the
            United States and other countries where they or their subprocessors
            operate. Those countries may have privacy laws that differ from the
            laws where you live.
          </p>
          <p>
            Where applicable law requires a transfer mechanism, GuideMyTank and
            its providers rely on appropriate legal, contractual, and technical
            safeguards made available for the relevant service and transfer.
            These may include adequacy decisions, approved contractual terms,
            or other recognized safeguards, as applicable. Each provider also
            describes its international processing practices in its own privacy
            or data-processing terms.
          </p>
        </div>
      </PrivacySection>

      <PrivacySection title="Data Security">
        <p>
          GuideMyTank uses reasonable administrative and technical measures
          intended to protect information and the operation of the site. No
          method of transmission or storage is completely secure, so absolute
          security cannot be guaranteed.
        </p>
      </PrivacySection>

      <PrivacySection title="Children's Privacy">
        <p>
          GuideMyTank is intended for a general audience and is not directed to
          children under 13. GuideMyTank does not knowingly collect personal
          information from children under 13. If you believe a child has
          provided personal information to GuideMyTank, please contact us so the
          matter can be reviewed and addressed.
        </p>
      </PrivacySection>

      <PrivacySection title="External Links">
        <p>
          GuideMyTank may link to third-party websites. We are not responsible
          for the privacy practices, content, or policies of external sites.
        </p>
      </PrivacySection>

      <PrivacySection title="Changes to This Policy">
        <p>
          This policy may be updated as GuideMyTank, its service providers, or
          applicable requirements change. The effective date at the top of this
          page will be updated when revisions are published. Material changes
          may also be communicated through an additional notice on the site
          when appropriate.
        </p>
      </PrivacySection>

      <PrivacySection title="Contact">
        <div className="space-y-4">
          <p>
            For privacy questions or requests, email{" "}
            <a href="mailto:contact@guidemytank.com" className="underline">
              contact@guidemytank.com
            </a>{" "}
            or use the{" "}
            <Link href="/contact" className="underline">
              Contact page
            </Link>
            . Please describe the request and the privacy right you want to
            exercise. Do not send identity documents unless we specifically
            request information needed to verify a request.
          </p>
          <p>
            Privacy rights and available request methods vary by location. This
            policy describes GuideMyTank&apos;s current implementation and is not a
            substitute for jurisdiction-specific legal advice.
          </p>
        </div>
      </PrivacySection>
      </article>
    </PageContainer>
  );
}

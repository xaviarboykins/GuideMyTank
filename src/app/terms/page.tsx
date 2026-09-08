import Link from "next/link";
import type { ReactNode } from "react";

import { PageContainer } from "@/components/site/page-container";

export const metadata = {
  title: "Terms of Service | GuideMyTank",
  description:
    "Terms governing the use of GuideMyTank aquarium information, planning tools, product data, and other site content.",
  alternates: { canonical: "/terms" },
};

function TermsSection({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <section className="border-t border-border py-8 first:border-t-0">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-4 space-y-4 leading-7 text-muted-foreground">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <PageContainer>
      <article className="mx-auto max-w-4xl">
        <header className="py-4 sm:py-8">
          <p className="text-sm font-medium text-muted-foreground">Legal</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Terms of Service</h1>
          <p className="mt-4 max-w-3xl leading-7 text-muted-foreground">
            These Terms of Service govern your access to and use of GuideMyTank and its aquarium
            information, guides, comparisons, calculators, and planning tools.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">Effective September 8, 2026</p>
        </header>

        <aside className="border-y border-border py-6" aria-labelledby="terms-summary">
          <h2 id="terms-summary" className="text-lg font-semibold">Terms at a glance</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 leading-7 text-muted-foreground">
            <li>GuideMyTank is an informational aquarium resource.</li>
            <li>Independently verify important aquarium care and stocking decisions.</li>
            <li>Third parties control product details, prices, advertisements, and external services.</li>
            <li>You may not copy, scrape, disrupt, or commercially exploit the site without permission.</li>
          </ul>
        </aside>

        <TermsSection title="Acceptance of These Terms">
          <p>
            GuideMyTank is an independently owned and operated sole proprietorship. In these terms,
            “GuideMyTank,” “we,” “us,” and “our” refer to the operator of guidemytank.com, and “you”
            refers to a visitor or user of the site.
          </p>
          <p>
            By accessing or using GuideMyTank, you agree to these Terms of Service and the policies
            referenced here. If you do not agree, do not use the site. You must be at least 13 years
            old to use GuideMyTank. If applicable law requires parental or guardian consent, you may
            use the site only with that consent.
          </p>
        </TermsSection>

        <TermsSection title="About the Service">
          <p>
            GuideMyTank provides public aquarium articles, care guides, comparison guides, product
            information, calculators, planning utilities, and related resources. Features and content
            may be added, changed, suspended, or removed at any time.
          </p>
        </TermsSection>

        <TermsSection title="Informational Purposes Only">
          <p>
            GuideMyTank content and tool results are for general informational and educational
            purposes. They are not veterinary, medical, scientific, legal, financial, or other
            professional advice and do not create a professional-client relationship.
          </p>
          <p>
            Aquarium environments and animals differ. Compatibility, stocking, water parameters,
            tank size, equipment, feeding, and care recommendations are estimates or general guidance,
            not guarantees. Results may depend on species, individual behavior, maturity, filtration,
            maintenance, water chemistry, and other conditions GuideMyTank cannot evaluate.
          </p>
        </TermsSection>

        <TermsSection title="Your Responsibilities">
          <p>
            You are responsible for your aquarium decisions, purchases, tank conditions, maintenance,
            and care practices. Verify important information using current reputable sources and,
            when appropriate, an experienced aquarist, aquatic specialist, manufacturer, retailer,
            or qualified veterinarian.
          </p>
          <p>
            You are responsible for protecting your device, maintaining backups of information saved
            locally, and complying with laws that apply to your aquarium, animals, plants, purchases,
            and use of the site.
          </p>
        </TermsSection>

        <TermsSection title="Permitted Use">
          <p>
            Subject to these terms, GuideMyTank grants you a limited, revocable, non-exclusive,
            non-transferable license to access and use the site and its content for lawful personal
            and non-commercial purposes. No ownership right is transferred, and all rights not
            expressly granted are reserved.
          </p>
        </TermsSection>

        <TermsSection title="Prohibited Conduct">
          <p>You may not:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Use the site or its content for an unlawful or fraudulent purpose.</li>
            <li>Copy, republish, sell, license, or commercially exploit substantial site content.</li>
            <li>Scrape, crawl, harvest, data-mine, or automatically extract content or product data.</li>
            <li>Circumvent access controls or attempt to access restricted areas without authorization.</li>
            <li>Introduce malware, overload the service, disrupt it, or interfere with other visitors.</li>
            <li>Misrepresent an affiliation with GuideMyTank or use its branding misleadingly.</li>
            <li>Infringe intellectual-property, privacy, publicity, or other rights.</li>
          </ul>
        </TermsSection>

        <TermsSection title="Intellectual Property">
          <p>
            GuideMyTank and its original text, organization, site design, graphics, databases, tool
            logic, and other original materials are owned by or licensed to GuideMyTank and protected
            by applicable laws. Third-party names, marks, product images, and materials remain their
            owners&apos; property. Reference to a third-party mark does not imply endorsement.
          </p>
        </TermsSection>

        <TermsSection title="Products, Prices, and Affiliate Links">
          <p>
            Product specifications, prices, availability, seller information, ratings, and images may
            come from third parties and can change or contain errors. Confirm material details with
            the seller or manufacturer before purchasing or relying on them.
          </p>
          <p>
            GuideMyTank may earn a commission from qualifying purchases made through certain links,
            without increasing your purchase price. Compensation does not create a warranty or make
            GuideMyTank the seller. See the{" "}
            <Link href="/affiliate-disclosure" className="underline">Affiliate Disclosure</Link>.
          </p>
        </TermsSection>

        <TermsSection title="Advertising and Third-Party Services">
          <p>
            GuideMyTank may display advertisements supplied by Google or other partners. An
            advertisement is not a GuideMyTank recommendation, guarantee, or endorsement. Advertisers
            and other third parties are responsible for their products, services, representations,
            transactions, and policies.
          </p>
          <p>
            GuideMyTank does not control external websites and services. Your use of them is governed
            by their terms and privacy practices. GuideMyTank is not responsible for external content,
            availability, security, transactions, products, or services.
          </p>
        </TermsSection>

        <TermsSection title="Privacy">
          <p>
            The <Link href="/privacy" className="underline">Privacy Policy</Link> explains how
            information is collected, used, shared, and protected, including information related to
            analytics, advertising, cookies, and browser storage.
          </p>
        </TermsSection>

        <TermsSection title="Availability and Termination">
          <p>
            GuideMyTank may restrict, suspend, or terminate access when reasonably necessary to
            protect the service, enforce these terms, comply with law, or address misuse. The site may
            experience errors, interruptions, maintenance, or data loss. Uninterrupted availability
            is not guaranteed. Provisions that should survive termination will remain in effect.
          </p>
        </TermsSection>

        <TermsSection title="Disclaimer of Warranties">
          <p>
            To the fullest extent permitted by law, GuideMyTank and its content and services are
            provided “as is” and “as available,” without warranties of any kind. GuideMyTank disclaims
            implied warranties of merchantability, fitness for a particular purpose, non-infringement,
            accuracy, availability, and reliability, and does not warrant that the site will be
            uninterrupted, secure, error-free, or suitable for a particular aquarium or animal.
          </p>
        </TermsSection>

        <TermsSection title="Limitation of Liability">
          <p>
            To the fullest extent permitted by law, GuideMyTank will not be liable for indirect,
            incidental, special, consequential, exemplary, or punitive damages; loss of data, revenue,
            profits, goodwill, or use; or injury, illness, death, livestock loss, plant loss, property
            damage, equipment failure, or other loss arising from the site, its content, tool results,
            advertisements, external links, or products. Nothing excludes liability that cannot
            lawfully be excluded or limited.
          </p>
        </TermsSection>

        <TermsSection title="Indemnification">
          <p>
            To the extent permitted by law, you agree to defend, indemnify, and hold GuideMyTank
            harmless from claims, liabilities, damages, losses, and reasonable expenses arising from
            your unlawful misuse of the site, violation of these terms, or infringement of another
            person&apos;s rights.
          </p>
        </TermsSection>

        <TermsSection title="Changes to These Terms">
          <p>
            GuideMyTank may update these terms as the site, its services, or applicable requirements
            change. The effective date will be updated when revisions are published. Material changes
            may also be communicated through a site notice. Continued use after updated terms take
            effect constitutes acceptance to the extent permitted by law.
          </p>
        </TermsSection>

        <TermsSection title="General Terms">
          <p>
            These terms and incorporated policies form the entire agreement concerning use of the
            site. If a provision is unenforceable, it will be limited or removed only to the minimum
            extent necessary, and the remaining provisions will continue in effect.
          </p>
          <p>
            A failure to enforce a provision is not a waiver. You may not assign your rights without
            prior written consent. GuideMyTank may assign its rights and obligations as part of a
            transfer or reorganization. These terms are governed by applicable law without overriding
            consumer protections that cannot lawfully be waived.
          </p>
        </TermsSection>

        <TermsSection title="Contact">
          <p>
            Questions about these terms may be sent to{" "}
            <a href="mailto:contact@guidemytank.com" className="underline">contact@guidemytank.com</a>{" "}
            or through the <Link href="/contact" className="underline">Contact page</Link>.
          </p>
          <p>
            These terms describe GuideMyTank&apos;s current service and are not a substitute for advice
            from a qualified legal professional.
          </p>
        </TermsSection>
      </article>
    </PageContainer>
  );
}

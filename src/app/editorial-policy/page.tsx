import Link from "next/link";

import { PageContainer } from "@/components/site/page-container";
import { PageHeader } from "@/components/site/page-header";

export const metadata = {
  title: "Editorial Policy | GuideMyTank",
  description:
    "How GuideMyTank researches, reviews, sources, updates, and corrects freshwater aquarium guidance and compatibility information.",
  alternates: { canonical: "/editorial-policy" },
};

const sectionClassName = "border-t border-border pt-6";
const headingClassName = "text-xl font-semibold";
const bodyClassName = "mt-3 space-y-3 leading-7 text-muted-foreground";

export default function EditorialPolicyPage() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="GuideMyTank Editorial Team"
        title="Editorial Policy"
        description="How GuideMyTank develops, reviews, and maintains freshwater aquarium information."
      />

      <article className="mt-8 max-w-4xl space-y-8">
        <section className={sectionClassName}>
          <h2 className={headingClassName}>Who produces this site</h2>
          <div className={bodyClassName}>
            <p>
              GuideMyTank is an independently operated freshwater aquarium
              reference and planning service. Published care guides, articles,
              and comparison guides are presented under the GuideMyTank
              Editorial Team byline. This is an organizational byline, not a
              claim of veterinary, scientific, or academic credentials.
            </p>
            <p>
              The operator&apos;s personal identity and home location are not
              published for privacy. GuideMyTank can be reached directly at{" "}
              <a
                href="mailto:contact@guidemytank.com"
                className="underline underline-offset-4"
              >
                contact@guidemytank.com
              </a>{" "}
              or through the{" "}
              <Link href="/contact" className="underline underline-offset-4">
                Contact page
              </Link>
              .
            </p>
          </div>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>What we publish</h2>
          <div className={bodyClassName}>
            <p>
              GuideMyTank publishes species records, care guides, practical
              articles, comparison guides, and interactive planning tools.
              Editorial pages are written to answer a defined fishkeeping
              question. Structured records support searchable facts and tool
              calculations, but do not replace the explanatory text and context
              on an editorial page.
            </p>
            <p>
              Compatibility pages are automated analyses produced from species
              data and safety rules. They are clearly separated from editorial
              articles and should be read with the documented{" "}
              <Link
                href="/compatibility/disclaimer"
                className="underline underline-offset-4"
              >
                compatibility methodology and limitations
              </Link>
              .
            </p>
          </div>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Research and source selection</h2>
          <div className={bodyClassName}>
            <p>
              Research favors primary or accountable sources when they are
              available, including veterinary manuals, university extension
              publications, government resources, scientific databases,
              conservation records, and established specialist aquarium
              references. Sources are selected for relevance to the exact claim,
              not merely because they rank well in search results.
            </p>
            <p>
              Important husbandry ranges are compared across sources. When
              reputable sources disagree, the published guidance uses a
              conservative range or explains the uncertainty rather than
              presenting a disputed value as certain. Sources used for an
              article or care guide are listed on that page whenever possible.
            </p>
          </div>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Editorial review process</h2>
          <div className={bodyClassName}>
            <ol className="list-decimal space-y-2 pl-5">
              <li>Define the reader&apos;s question and the useful outcome.</li>
              <li>Gather and compare sources appropriate to the subject.</li>
              <li>Draft practical guidance with species-specific context.</li>
              <li>
                Check factual claims against cited sources and structured species
                records.
              </li>
              <li>
                Review headings, links, images, attribution, and page rendering.
              </li>
              <li>Publish with visible publication and update dates.</li>
            </ol>
            <p>
              Software may assist with organization, consistency checks, data
              analysis, or drafting. Automation is not treated as a source of
              truth, and material is not approved solely because software
              generated it. Editorial pages require review before publication.
            </p>
          </div>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Images, attribution, and independence</h2>
          <div className={bodyClassName}>
            <p>
              Images must be owned by GuideMyTank, licensed for reuse, or used
              with permission. When a license or creator requires attribution,
              the credit and available source link are displayed with the image.
            </p>
            <p>
              Commercial relationships do not determine compatibility scores or
              husbandry conclusions. Pages containing affiliate relationships
              are governed by the{" "}
              <Link
                href="/affiliate-disclosure"
                className="underline underline-offset-4"
              >
                Affiliate Disclosure
              </Link>
              .
            </p>
          </div>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Corrections and updates</h2>
          <div className={bodyClassName}>
            <p>
              Aquarium knowledge, product availability, and source material can
              change. GuideMyTank reviews published material when new evidence,
              reader feedback, or an internal audit identifies a possible issue.
              Material changes update the page&apos;s visible modified date.
            </p>
            <p>
              To report an error, include the page URL, the statement in
              question, and a supporting source when available. Send it to{" "}
              <a
                href="mailto:contact@guidemytank.com"
                className="underline underline-offset-4"
              >
                contact@guidemytank.com
              </a>
              . Reports are assessed on their evidence and may result in a text,
              data, or compatibility-rule correction.
            </p>
          </div>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Responsible use</h2>
          <div className={bodyClassName}>
            <p>
              GuideMyTank provides educational planning information, not
              veterinary diagnosis or a guarantee of animal behavior. Aquarists
              remain responsible for testing their water, observing individual
              animals, quarantining livestock, and seeking a qualified aquatic
              veterinarian when professional care is needed. See the full{" "}
              <Link href="/disclaimer" className="underline underline-offset-4">
                Disclaimer
              </Link>
              .
            </p>
          </div>
        </section>

        <p className="border-t border-border pt-6 text-sm text-muted-foreground">
          Last reviewed: October 9, 2026
        </p>
      </article>
    </PageContainer>
  );
}

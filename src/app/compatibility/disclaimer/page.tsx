import type { Metadata } from "next";
import Link from "next/link";

import { PageContainer } from "@/components/site/page-container";
import { PageHeader } from "@/components/site/page-header";

export const metadata: Metadata = {
  title: "Aquarium Compatibility Methodology | GuideMyTank",
  description:
    "How GuideMyTank evaluates aquarium species compatibility, applies safety constraints, measures data confidence, and communicates limitations.",
  alternates: { canonical: "/compatibility/disclaimer" },
};

function MethodSection({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="border-t py-7">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-3 space-y-4 text-sm leading-7 text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

export default function CompatibilityDisclaimerPage() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Methodology"
        title="How GuideMyTank Evaluates Compatibility"
        description="A transparent explanation of the evidence, safety rules, confidence labels, and limitations behind each compatibility report."
      />

      <p className="mt-6 text-sm text-muted-foreground">
        Methodology last reviewed September 29, 2026.
      </p>

      <div className="mt-8 max-w-4xl">
        <MethodSection title="What the verdict means">
          <dl className="grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="font-semibold text-foreground">Recommended</dt>
              <dd>Available data supports planning the pair when normal species-specific requirements are met.</dd>
            </div>
            <div>
              <dt className="font-semibold text-foreground">Conditional</dt>
              <dd>The pair may work only when the report&apos;s listed conditions can be provided and monitored.</dd>
            </div>
            <div>
              <dt className="font-semibold text-foreground">Not recommended</dt>
              <dd>A safety conflict such as predation, fin damage, territorial injury, or irreconcilable husbandry makes the pair unsuitable to plan.</dd>
            </div>
          </dl>
        </MethodSection>

        <MethodSection title="Factors considered">
          <p>
            The structured model evaluates preferred temperature and pH overlap,
            temperament and aggression, social or schooling needs, adult-size
            predation risk, and minimum aquarium requirements. Contextual rules
            also consider hardness, flow, activity and feeding speed, swimming
            zone, territory footprint, breeding aggression, specialist setups,
            invertebrate safety, and vulnerability to fin-nipping.
          </p>
        </MethodSection>

        <MethodSection title="Safety constraints come before favorable overlap">
          <p>
            Matching temperature or pH cannot cancel a serious behavioral or
            predation risk. Hard safety constraints cap the verdict when the
            data identifies prey-size differences, a fin-nipper paired with a
            vulnerable fish, opposing temperature categories, species-only
            behavior, severe aggression, or overlapping high-intensity
            territories.
          </p>
          <p>
            Less severe issues—such as limited parameter overlap, group-size
            requirements, feeding competition, or a specialist habitat—produce
            a conditional result instead of being hidden inside a numeric score.
          </p>
        </MethodSection>

        <MethodSection title="Data confidence is not a success probability">
          <p>
            High, moderate, and limited confidence describe completeness of the
            underlying species records. They do not predict a percentage chance
            that two individual animals will coexist. A complete record can
            support a confident “not recommended” verdict, while missing traits
            prevent an unconditional recommendation.
          </p>
        </MethodSection>

        <MethodSection title="Sources and expert overrides">
          <p>
            Species records can include source references for care ranges and
            husbandry traits. Those references are listed on compatibility
            reports when available. A reviewed expert override may replace the
            computed verdict for a specific pair; the report labels that source
            and displays the reviewer&apos;s note. Computed evidence remains visible
            as context rather than being silently discarded.
          </p>
        </MethodSection>

        <MethodSection title="Validation and change control">
          <p>
            GuideMyTank runs the engine across every canonical species pair and
            maintains a reviewed regression set covering community fish,
            predators, fin-nippers, territorial species, temperature conflicts,
            invertebrates, and schooling requirements. A model change must keep
            those expected outcomes within their reviewed safety bounds.
          </p>
        </MethodSection>

        <MethodSection title="What the tool cannot know">
          <ul className="list-disc space-y-2 pl-5">
            <li>The temperament, sex, age, health, or history of an individual animal.</li>
            <li>Your exact tank footprint, stocking density, aquascape, filtration, and maintenance consistency.</li>
            <li>Whether required group sizes and sex ratios will actually be maintained.</li>
            <li>How aggression may change during breeding, maturation, illness, or stress.</li>
            <li>Whether a broad database record, such as a generic Corydoras entry, represents the exact species being sold.</li>
          </ul>
        </MethodSection>

        <MethodSection title="Responsible use">
          <p>
            Confirm both species&apos; care requirements, quarantine new livestock,
            introduce animals gradually, observe feeding and stress, and keep a
            safe separation plan. Do not use a compatibility report as a reason
            to ignore direct aggression, injury, weight loss, hiding, or poor
            water quality.
          </p>
          <p>
            See the broader <Link href="/disclaimer" className="font-medium text-foreground underline-offset-4 hover:underline">GuideMyTank disclaimer</Link> or return to the <Link href="/compatibility" className="font-medium text-foreground underline-offset-4 hover:underline">Compatibility Checker</Link>.
          </p>
        </MethodSection>
      </div>
    </PageContainer>
  );
}

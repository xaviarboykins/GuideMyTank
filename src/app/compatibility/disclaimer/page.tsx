import type { Metadata } from "next";
import Link from "next/link";

import { PageContainer } from "@/components/site/page-container";
import { PageHeader } from "@/components/site/page-header";

export const metadata: Metadata = {
  title: "Compatibility Disclaimer | GuideMyTank",
  description:
    "Learn how GuideMyTank compatibility scores work and how to use them responsibly when choosing aquarium tankmates.",
};

export default function CompatibilityDisclaimerPage() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Compatibility Guidance"
        title="Compatibility Disclaimer"
        description="GuideMyTank compatibility scores are designed to support better aquarium planning, not replace careful observation or responsible husbandry."
      />

      <div className="mt-8 grid gap-6">
        <section className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold">
            How compatibility scores work
          </h2>

          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            The GuideMyTank compatibility score estimates how likely two species
            are to coexist based on known aquarium husbandry factors, including
            temperature overlap, pH overlap, temperament, aggression risk,
            schooling needs, predation risk, and minimum tank size requirements.
          </p>
        </section>

        <section className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold">
            Recommendations, not guarantees
          </h2>

          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            A high score does not guarantee success, and a caution result does
            not always mean a pairing is impossible. Compatibility should be
            used as a planning signal alongside tank size, aquascape,
            filtration, stocking level, water quality, and the specific behavior
            of the fish involved.
          </p>
        </section>

        <section className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold">Fish behavior can vary</h2>

          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Individual fish may behave differently from typical species
            profiles. Age, sex, breeding behavior, territory, stress, prior
            experiences, and tank conditions can all influence aggression,
            hiding, feeding, and social behavior.
          </p>
        </section>

        <section className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold">
            Best practices for new tankmates
          </h2>

          <ul className="mt-3 space-y-2 text-sm leading-7 text-muted-foreground">
            <li>• Research both species before purchase.</li>
            <li>• Quarantine new fish when possible.</li>
            <li>• Match temperature, pH, hardness, and tank size needs.</li>
            <li>• Provide hiding places, visual breaks, and swimming space.</li>
            <li>• Introduce new tankmates slowly and observe closely.</li>
            <li>• Have a backup plan if aggression or stress appears.</li>
          </ul>
        </section>

        <section className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold">
            Transparent recommendation philosophy
          </h2>

          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            GuideMyTank aims to make aquarium recommendations transparent and
            understandable. Compatibility results include reasoning whenever
            possible so aquarists can see why a pairing may be recommended,
            flagged for caution, or marked incompatible.
          </p>
        </section>

        <Link
          href="/compatibility"
          className="text-sm font-medium underline-offset-4 hover:underline"
        >
          Back to Compatibility Checker
        </Link>
      </div>
    </PageContainer>
  );
}

import Link from "next/link";

import { CompatibilityBadge } from "@/components/compatibility/compatibility-badge";
import { ExpertValidationBadge } from "@/components/compatibility/expert-validation-badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type {
  CompatibilityResult,
  SpeciesCompatibilityGroup,
} from "@/lib/compatibility/types";
import { getCompatibilityPath } from "@/lib/compatibility/urls";

type SpeciesCompatibilitySectionsProps = {
  currentSpeciesSlug: string;
  compatibility: SpeciesCompatibilityGroup;
};

function getRelatedSpecies(
  rule: CompatibilityResult,
  currentSpeciesSlug: string,
) {
  return rule.species_a.slug === currentSpeciesSlug
    ? rule.species_b
    : rule.species_a;
}

function CompatibilityList({
  rules,
  currentSpeciesSlug,
}: {
  rules: CompatibilityResult[];
  currentSpeciesSlug: string;
}) {
  if (rules.length === 0) {
    return (
      <p className="rounded-md border bg-muted/40 p-4 text-sm text-muted-foreground">
        No compatibility data available yet.
      </p>
    );
  }

  return (
    <div className="max-h-[24rem] space-y-3 overflow-y-auto pr-2 md:max-h-[30rem]">
      {rules.map((rule) => {
        const relatedSpecies = getRelatedSpecies(rule, currentSpeciesSlug);
        const compatibilityPath = getCompatibilityPath(
          currentSpeciesSlug,
          relatedSpecies.slug,
        );

        return (
          <article
            key={`${rule.species_a.slug}-${rule.species_b.slug}`}
            className="rounded-md border bg-background p-4 transition-colors hover:bg-muted/40"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <Link
                  href={compatibilityPath}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  {relatedSpecies.common_name}
                </Link>

                <p className="mt-2 text-sm text-muted-foreground">
                  Score: {rule.score} - {rule.status}
                </p>
                <div className="mt-2">
                  <ExpertValidationBadge
                    expertValidated={rule.expertValidated}
                  />
                </div>
              </div>

              <CompatibilityBadge compatibility={rule.compatibility} />
            </div>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {rule.notes ?? rule.reasons[0]}
            </p>

            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <Link
                href={compatibilityPath}
                className="font-medium underline-offset-4 hover:underline"
              >
                View compatibility report
              </Link>

              <Link
                href={`/species/${relatedSpecies.slug}`}
                className="font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                View species profile
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function SpeciesCompatibilitySections({
  currentSpeciesSlug,
  compatibility,
}: SpeciesCompatibilitySectionsProps) {
  return (
    <section className="mt-10 space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">Species Compatibility</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Database-driven compatibility notes for planning community aquariums.
        </p>
      </div>

      <Accordion type="multiple" className="space-y-4">
        <AccordionItem
          value="compatible"
          className="rounded-lg border bg-card px-6"
        >
          <AccordionTrigger className="text-left hover:no-underline">
            <div>
              <h3 className="text-xl font-semibold">
                Compatible Species ({compatibility.compatible.length})
              </h3>
              <p className="mt-1 text-sm font-normal text-muted-foreground">
                Species that are generally suitable tank mates.
              </p>
            </div>
          </AccordionTrigger>

          <AccordionContent>
            <CompatibilityList
              rules={compatibility.compatible}
              currentSpeciesSlug={currentSpeciesSlug}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem
          value="caution"
          className="rounded-lg border bg-card px-6"
        >
          <AccordionTrigger className="text-left hover:no-underline">
            <div>
              <h3 className="text-xl font-semibold">
                Use Caution ({compatibility.caution.length})
              </h3>
              <p className="mt-1 text-sm font-normal text-muted-foreground">
                Species that may work, but need closer planning.
              </p>
            </div>
          </AccordionTrigger>

          <AccordionContent>
            <CompatibilityList
              rules={compatibility.caution}
              currentSpeciesSlug={currentSpeciesSlug}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem
          value="incompatible"
          className="rounded-lg border bg-card px-6"
        >
          <AccordionTrigger className="text-left hover:no-underline">
            <div>
              <h3 className="text-xl font-semibold">
                Incompatible Species ({compatibility.incompatible.length})
              </h3>
              <p className="mt-1 text-sm font-normal text-muted-foreground">
                Species that should generally be avoided together.
              </p>
            </div>
          </AccordionTrigger>

          <AccordionContent>
            <CompatibilityList
              rules={compatibility.incompatible}
              currentSpeciesSlug={currentSpeciesSlug}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}

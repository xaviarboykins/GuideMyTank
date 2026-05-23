import Link from "next/link";

import { CompatibilityBadge } from "@/components/compatibility/compatibility-badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type {
  CompatibilityResult,
  SpeciesCompatibilityGroup,
} from "@/lib/data/compatibility";

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
    <div className="space-y-3">
      {rules.map((rule) => {
        const relatedSpecies = getRelatedSpecies(rule, currentSpeciesSlug);

        return (
          <article
            key={`${rule.species_a.slug}-${rule.species_b.slug}`}
            className="rounded-md border bg-background p-4"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Link
                href={`/species/${relatedSpecies.slug}`}
                className="font-medium underline-offset-4 hover:underline"
              >
                {relatedSpecies.common_name}
              </Link>

              <CompatibilityBadge compatibility={rule.compatibility} />
            </div>

            {rule.notes && (
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {rule.notes}
              </p>
            )}
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

      <Accordion
        type="multiple"
        defaultValue={["compatible"]}
        className="space-y-4"
      >
        <AccordionItem
          value="compatible"
          className="rounded-lg border bg-card px-6"
        >
          <AccordionTrigger className="text-left hover:no-underline">
            <div>
              <h3 className="text-xl font-semibold">Compatible Species</h3>
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
              <h3 className="text-xl font-semibold">Use Caution</h3>
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
              <h3 className="text-xl font-semibold">Incompatible Species</h3>
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

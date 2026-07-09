"use client";

import { CheckCircle2, Droplets, Gauge, Plus, Waves, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import type {
  AquariumBuild,
  AquariumEquipmentProduct,
  AquariumFiltrationLevel,
  AquariumLivestockEntry,
  AquariumPlantEntry,
  AquariumPlantedLevel,
  AquariumTankConfiguration,
  AquariumSpecies,
} from "@/lib/aquarium-builder/types";
import {
  AQUARIUM_BUILDER_STORAGE_KEY,
  defaultAquariumBuild,
  parseAquariumBuild,
} from "@/lib/aquarium-builder/storage";

type TankSizeGallons = AquariumTankConfiguration["sizeGallons"];
type StatusTone = "success" | "info" | "neutral" | "warning" | "critical";
type SingleSelectionCategory =
  | "tank"
  | "filtration"
  | "heating"
  | "lighting";
type RepeatableSelectionCategory =
  | "substrate"
  | "plants"
  | "livestock"
  | "decor";
type BuilderRow =
  | {
      kind: "single";
      category: SingleSelectionCategory;
      label: string;
      action: string;
      href: string;
    }
  | {
      kind: "repeatable";
      category: RepeatableSelectionCategory;
      label: string;
      action: string;
      addAnotherAction: string;
      href: string;
    };

type BuilderComponentSelection = {
  name: string;
  summary?: string;
  quantity?: number;
  estimatedPrice?: AquariumEquipmentProduct["estimatedPrice"];
  tank?: Pick<AquariumTankConfiguration, "sizeGallons">;
  filtrationLevel?: AquariumFiltrationLevel;
  plantedLevel?: AquariumPlantedLevel;
};

type SingleSelections = Partial<
  Record<SingleSelectionCategory, BuilderComponentSelection>
>;
type RepeatableSelections = Partial<
  Record<RepeatableSelectionCategory, BuilderComponentSelection[]>
>;

const statusToneClasses: Record<StatusTone, string> = {
  success: "bg-emerald-600 text-white",
  info: "bg-sky-600 text-white",
  neutral: "bg-muted text-foreground",
  warning: "bg-amber-500 text-amber-950",
  critical: "bg-destructive text-destructive-foreground",
};

const flowMultipliers: Record<AquariumFiltrationLevel, number> = {
  low: 4,
  standard: 6,
  high: 8,
};

const builderRows: BuilderRow[] = [
  {
    kind: "single",
    category: "tank",
    label: "Tank",
    action: "Choose Tank",
    href: "/aquarium-builder/products/tanks",
  },
  {
    kind: "single",
    category: "filtration",
    label: "Filtration",
    action: "Choose Filter",
    href: "/aquarium-builder/products/filters",
  },
  {
    kind: "single",
    category: "heating",
    label: "Heating",
    action: "Choose Heater",
    href: "/aquarium-builder/products/heaters",
  },
  {
    kind: "single",
    category: "lighting",
    label: "Lighting",
    action: "Choose Lighting",
    href: "/aquarium-builder/products/lights",
  },
  {
    kind: "repeatable",
    category: "substrate",
    label: "Substrate",
    action: "Choose Substrate",
    addAnotherAction: "Add Another Substrate",
    href: "/aquarium-builder/products/substrates",
  },
  {
    kind: "repeatable",
    category: "plants",
    label: "Plants",
    action: "Add/Edit Plants",
    addAnotherAction: "Add/Edit Plants",
    href: "/aquarium-builder/plants",
  },
  {
    kind: "repeatable",
    category: "livestock",
    label: "Livestock",
    action: "Add/Edit Livestock",
    addAnotherAction: "Add/Edit Livestock",
    href: "/aquarium-builder/livestock",
  },
  {
    kind: "repeatable",
    category: "decor",
    label: "Decor",
    action: "Add Decor",
    addAnotherAction: "Add Another Decor Item",
    href: "/aquarium-builder/products/decor",
  },
];

function formatLevelLabel(level: string | null) {
  if (!level) {
    return null;
  }

  return level.charAt(0).toUpperCase() + level.slice(1);
}

function estimateFlowGph(
  sizeGallons: TankSizeGallons | null,
  filtrationLevel: AquariumFiltrationLevel | null,
) {
  if (!sizeGallons || !filtrationLevel) {
    return null;
  }

  return sizeGallons * flowMultipliers[filtrationLevel];
}

export function AquariumBuilderInterface({
  species,
}: {
  species: AquariumSpecies[];
}) {
  const [singleSelections, setSingleSelections] = useState<SingleSelections>(
    {},
  );
  const [repeatableSelections, setRepeatableSelections] =
    useState<RepeatableSelections>({});
  const [build] = useState<AquariumBuild>(() => {
    if (typeof window === "undefined") {
      return defaultAquariumBuild;
    }

    return parseAquariumBuild(
      window.localStorage.getItem(AQUARIUM_BUILDER_STORAGE_KEY),
    );
  });

  const tankSizeGallons = singleSelections.tank?.tank?.sizeGallons ?? null;
  const filtrationLevel =
    singleSelections.filtration?.filtrationLevel ?? null;
  const plantedLevel =
    build.tank.plantedLevel !== "none" ? build.tank.plantedLevel : null;
  const plantSpeciesCount = build.plants.length;
  const plantTotalCount = build.plants.reduce((total, entry) => {
    return total + entry.quantity;
  }, 0);
  const plantSummary =
    plantSpeciesCount > 0
      ? `${plantSpeciesCount} ${
          plantSpeciesCount === 1 ? "plant" : "plants"
        } - ${plantTotalCount} total`
      : "No plants selected";
  const livestockSpeciesBySlug = useMemo(() => {
    return new Map(species.map((item) => [item.slug, item]));
  }, [species]);
  const livestockSpeciesCount = build.livestock.length;
  const livestockTotalCount = build.livestock.reduce((total, entry) => {
    return total + entry.quantity;
  }, 0);
  const livestockSummary =
    livestockSpeciesCount > 0
      ? `${livestockSpeciesCount} ${
          livestockSpeciesCount === 1 ? "species" : "species"
        } - ${livestockTotalCount} ${
          livestockTotalCount === 1 ? "animal" : "animals"
        }`
      : "No livestock selected";

  const flowEstimateGph = useMemo(
    () => estimateFlowGph(tankSizeGallons, filtrationLevel),
    [tankSizeGallons, filtrationLevel],
  );

  const builderStatus = [
    {
      label: "Compatibility",
      value: "No issues found",
      tone: "success",
      icon: CheckCircle2,
      className: "lg:flex-[2]",
    },
    {
      label: "Estimated Stocking",
      value: "0%",
      tone: "success",
      icon: Gauge,
      className: "flex-1",
    },
    {
      label: "Water Volume",
      value: tankSizeGallons ? `${tankSizeGallons} gal` : "Not selected",
      tone: tankSizeGallons ? "info" : "neutral",
      icon: Droplets,
      className: "flex-1",
    },
    {
      label: "Flow Estimate",
      value: flowEstimateGph ? `${flowEstimateGph} GPH` : "Not selected",
      tone: flowEstimateGph ? "info" : "neutral",
      icon: Waves,
      className: "flex-1",
    },
    {
      label: "Planted Level",
      value: formatLevelLabel(plantedLevel) ?? "Not selected",
      tone: plantedLevel ? "info" : "neutral",
      icon: Waves,
      className: "flex-1",
    },
  ] as const;

  function clearSingleSelection(category: SingleSelectionCategory) {
    setSingleSelections((currentSelections) => {
      const nextSelections = { ...currentSelections };
      delete nextSelections[category];
      return nextSelections;
    });
  }

  function clearRepeatableSelection(
    category: RepeatableSelectionCategory,
    index: number,
  ) {
    setRepeatableSelections((currentSelections) => {
      const currentItems = currentSelections[category] ?? [];
      const nextItems = currentItems.filter((_, itemIndex) => {
        return itemIndex !== index;
      });
      const nextSelections = { ...currentSelections };

      if (nextItems.length > 0) {
        nextSelections[category] = nextItems;
      } else {
        delete nextSelections[category];
      }

      return nextSelections;
    });
  }

  return (
    <>
      <section className="mt-6 overflow-hidden border border-border bg-card">
        <h2 className="sr-only">Builder Status</h2>

        <dl className="flex overflow-x-auto divide-x divide-background/25">
          {builderStatus.map((item) => (
            <div
              key={item.label}
              className={[
                "flex min-h-8 shrink-0 items-center gap-1.5 whitespace-nowrap px-3 py-1.5 text-xs",
                statusToneClasses[item.tone],
                item.className,
              ].join(" ")}
            >
              <item.icon className="size-3.5 shrink-0" aria-hidden="true" />
              <dt className="shrink-0 font-bold">{item.label}:</dt>
              <dd className="min-w-0">{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-6 border border-border bg-card">
        <div className="border-b border-border p-4">
          <h2 className="text-lg font-semibold">Tank Configuration</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th scope="col" className="w-40 px-4 py-3 font-semibold">
                  Category
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Selection
                </th>
              </tr>
            </thead>
            <tbody>
              {builderRows.map((row) => (
                <tr key={row.category} className="border-t border-border">
                  <th scope="row" className="px-4 py-3 text-left font-medium">
                    {row.label}
                  </th>
                  <td className="px-4 py-3">
                    {row.kind === "single" ? (
                      <SingleSelectionCell
                        action={row.action}
                        href={row.href}
                        selection={singleSelections[row.category] ?? null}
                        onClear={() => clearSingleSelection(row.category)}
                      />
                    ) : null}

                    {row.kind === "repeatable" &&
                    row.category === "livestock" ? (
                      <LivestockSelectionCell
                        action={row.action}
                        href={row.href}
                        livestock={build.livestock}
                        speciesBySlug={livestockSpeciesBySlug}
                        summary={livestockSummary}
                      />
                    ) : null}

                    {row.kind === "repeatable" && row.category === "plants" ? (
                      <PlantSelectionCell
                        action={row.action}
                        href={row.href}
                        plants={build.plants}
                        summary={plantSummary}
                      />
                    ) : null}

                    {row.kind === "repeatable" &&
                    row.category !== "livestock" &&
                    row.category !== "plants" ? (
                      <RepeatableSelectionCell
                        action={row.action}
                        addAnotherAction={row.addAnotherAction}
                        href={row.href}
                        selections={repeatableSelections[row.category] ?? []}
                        onClear={(index) =>
                          clearRepeatableSelection(row.category, index)
                        }
                      />
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 border border-border bg-card">
        <div className="border-b border-border p-4">
          <h2 className="text-lg font-semibold">Tank Breakdown</h2>
        </div>

        <div className="grid gap-6 p-4 text-sm md:grid-cols-2">
          <div>
            <h3 className="font-semibold">Configuration</h3>
            <dl className="mt-3 space-y-2">
              <BreakdownRow
                label="Tank"
                value={
                  tankSizeGallons ? `${tankSizeGallons} gal` : "Not selected"
                }
              />
              <BreakdownRow
                label="Filtration"
                value={formatLevelLabel(filtrationLevel) ?? "Not selected"}
              />
              <BreakdownRow
                label="Planted Level"
                value={formatLevelLabel(plantedLevel) ?? "Not selected"}
              />
            </dl>
          </div>

          <div>
            <h3 className="font-semibold">Livestock</h3>
            <dl className="mt-3 space-y-2">
              <BreakdownRow
                label="Species"
                value={String(livestockSpeciesCount)}
              />
              <BreakdownRow
                label="Total Count"
                value={String(livestockTotalCount)}
              />
            </dl>

            {build.livestock.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {build.livestock.map((entry) => {
                  const item = livestockSpeciesBySlug.get(entry.speciesSlug);

                  return (
                    <li
                      key={entry.speciesSlug}
                      className="border border-border bg-background p-3"
                    >
                      <div className="font-medium">
                        {item?.common_name ?? entry.speciesSlug}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Quantity: {entry.quantity}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                No livestock selected yet.
              </p>
            )}
          </div>

          <div>
            <h3 className="font-semibold">Plants</h3>
            <dl className="mt-3 space-y-2">
              <BreakdownRow label="Plant Types" value={String(plantSpeciesCount)} />
              <BreakdownRow label="Total Count" value={String(plantTotalCount)} />
            </dl>

            {build.plants.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {build.plants.map((entry) => (
                  <li
                    key={entry.plantSlug}
                    className="border border-border bg-background p-3"
                  >
                    <div className="font-medium">{entry.plantSlug}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Quantity: {entry.quantity}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                No plants selected yet.
              </p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

function BreakdownRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border pb-2 last:border-b-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

function SingleSelectionCell({
  action,
  href,
  selection,
  onClear,
}: {
  action: string;
  href: string;
  selection: BuilderComponentSelection | null;
  onClear: () => void;
}) {
  if (selection) {
    return (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-medium">{selection.name}</div>
          {selection.summary ? (
            <div className="mt-1 text-xs text-muted-foreground">
              {selection.summary}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-1">
          <Button asChild variant="outline" size="sm">
            <Link href={href}>Change</Link>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Remove ${selection.name}`}
            onClick={onClear}
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button
      asChild
      size="sm"
      className="h-8 bg-sky-600 text-white hover:bg-sky-700"
    >
      <Link href={href}>
        <Plus className="size-4" aria-hidden="true" />
        {action}
      </Link>
    </Button>
  );
}

function PlantSelectionCell({
  action,
  href,
  plants,
  summary,
}: {
  action: string;
  href: string;
  plants: AquariumPlantEntry[];
  summary: string;
}) {
  if (plants.length === 0) {
    return <PlaceholderSelectionCell action={action} href={href} />;
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="font-medium">{summary}</div>
        <div className="mt-1 text-xs text-muted-foreground">
          {plants
            .slice(0, 3)
            .map((entry) => `${entry.plantSlug} x${entry.quantity}`)
            .join(", ")}
          {plants.length > 3 ? "..." : ""}
        </div>
      </div>

      <Button asChild variant="outline" size="sm">
        <Link href={href}>
          <Plus className="size-4" aria-hidden="true" />
          {action}
        </Link>
      </Button>
    </div>
  );
}

function LivestockSelectionCell({
  action,
  href,
  livestock,
  speciesBySlug,
  summary,
}: {
  action: string;
  href: string;
  livestock: AquariumLivestockEntry[];
  speciesBySlug: Map<string, AquariumSpecies>;
  summary: string;
}) {
  if (livestock.length === 0) {
    return <PlaceholderSelectionCell action={action} href={href} />;
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="font-medium">{summary}</div>
        <div className="mt-1 text-xs text-muted-foreground">
          {livestock
            .slice(0, 3)
            .map((entry) => {
              const item = speciesBySlug.get(entry.speciesSlug);

              return `${item?.common_name ?? entry.speciesSlug} x${entry.quantity}`;
            })
            .join(", ")}
          {livestock.length > 3 ? "..." : ""}
        </div>
      </div>

      <Button asChild variant="outline" size="sm">
        <Link href={href}>
          <Plus className="size-4" aria-hidden="true" />
          {action}
        </Link>
      </Button>
    </div>
  );
}

function RepeatableSelectionCell({
  action,
  addAnotherAction,
  href,
  selections,
  onClear,
}: {
  action: string;
  addAnotherAction: string;
  href: string;
  selections: BuilderComponentSelection[];
  onClear: (index: number) => void;
}) {
  if (selections.length === 0) {
    return <PlaceholderSelectionCell action={action} href={href} />;
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {selections.map((selection, index) => (
          <li
            key={`${selection.name}-${index}`}
            className="flex flex-col gap-2 border border-border bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <div className="font-medium">{selection.name}</div>
              {selection.summary ? (
                <div className="mt-1 text-xs text-muted-foreground">
                  {selection.summary}
                </div>
              ) : null}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Remove ${selection.name}`}
              onClick={() => onClear(index)}
            >
              <X className="size-4" aria-hidden="true" />
            </Button>
          </li>
        ))}
      </ul>

      <Button asChild variant="outline" size="sm">
        <Link href={href}>
          <Plus className="size-4" aria-hidden="true" />
          {addAnotherAction}
        </Link>
      </Button>
    </div>
  );
}

function PlaceholderSelectionCell({
  action,
  href,
}: {
  action: string;
  href: string;
}) {
  return (
    <Button
      asChild
      size="sm"
      className="h-8 bg-sky-600 text-white hover:bg-sky-700"
    >
      <Link href={href}>
        <Plus className="size-4" aria-hidden="true" />
        {action}
      </Link>
    </Button>
  );
}

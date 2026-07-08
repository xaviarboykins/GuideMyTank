"use client";

import { CheckCircle2, Droplets, Gauge, Plus, Waves, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import type {
  AquariumEquipmentProduct,
  AquariumFiltrationLevel,
  AquariumPlantedLevel,
  AquariumTankConfiguration,
} from "@/lib/aquarium-builder/types";
import type { AquariumBuilderProductCategorySlug } from "@/lib/aquarium-builder/product-categories";

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
      productCategory: AquariumBuilderProductCategorySlug;
    }
  | {
      kind: "repeatable";
      category: RepeatableSelectionCategory;
      label: string;
      action: string;
      addAnotherAction: string;
      productCategory: AquariumBuilderProductCategorySlug;
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
    productCategory: "tanks",
  },
  {
    kind: "single",
    category: "filtration",
    label: "Filtration",
    action: "Choose Filter",
    productCategory: "filters",
  },
  {
    kind: "single",
    category: "heating",
    label: "Heating",
    action: "Choose Heater",
    productCategory: "heaters",
  },
  {
    kind: "single",
    category: "lighting",
    label: "Lighting",
    action: "Choose Lighting",
    productCategory: "lights",
  },
  {
    kind: "repeatable",
    category: "substrate",
    label: "Substrate",
    action: "Choose Substrate",
    addAnotherAction: "Add Another Substrate",
    productCategory: "substrates",
  },
  {
    kind: "repeatable",
    category: "plants",
    label: "Plants",
    action: "Choose Plants",
    addAnotherAction: "Add Another Plant",
    productCategory: "plants",
  },
  {
    kind: "repeatable",
    category: "livestock",
    label: "Livestock",
    action: "Add Livestock",
    addAnotherAction: "Add Another Livestock",
    productCategory: "livestock",
  },
  {
    kind: "repeatable",
    category: "decor",
    label: "Decor",
    action: "Add Decor",
    addAnotherAction: "Add Another Decor Item",
    productCategory: "decor",
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

export function AquariumBuilderInterface() {
  const [singleSelections, setSingleSelections] = useState<SingleSelections>(
    {},
  );
  const [repeatableSelections, setRepeatableSelections] =
    useState<RepeatableSelections>({});

  const tankSizeGallons = singleSelections.tank?.tank?.sizeGallons ?? null;
  const filtrationLevel =
    singleSelections.filtration?.filtrationLevel ?? null;
  const plantedLevel =
    repeatableSelections.plants?.find((plant) => plant.plantedLevel)
      ?.plantedLevel ?? null;

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
                        href={`/aquarium-builder/products/${row.productCategory}`}
                        selection={singleSelections[row.category] ?? null}
                        onClear={() => clearSingleSelection(row.category)}
                      />
                    ) : null}

                    {row.kind === "repeatable" ? (
                      <RepeatableSelectionCell
                        action={row.action}
                        addAnotherAction={row.addAnotherAction}
                        href={`/aquarium-builder/products/${row.productCategory}`}
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
    </>
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

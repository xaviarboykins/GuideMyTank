"use client";

import {
  AlertTriangle,
  CircleHelp,
  Droplets,
  Gauge,
  Plus,
  Waves,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { runAquariumBuilderValidation } from "@/app/aquarium-builder/actions";
import { ProductThumbnail } from "@/components/products/product-thumbnail";
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
  deriveAquariumEquipmentProductSelections,
  defaultAquariumBuild,
  parseAquariumBuild,
  serializeAquariumBuild,
} from "@/lib/aquarium-builder/storage";
import type { ProductCategory } from "@/lib/products/types";
import type { Plant } from "@/lib/plants/types";
import {
  analyzeStocking,
  deriveAquariumFiltrationLevel,
  deriveAquariumPlantedLevel,
  normalizeStockingAnalysisInput,
  STOCKING_STATUS_LABELS,
  type StockingAnalysisResult,
  type StockingStatus,
} from "@/lib/aquarium-builder/stocking-analysis";
import {
  getCompatibilityDisplayState,
  getValidationDisplayState,
} from "@/lib/aquarium-builder/validation-display";
import type {
  AquariumValidationReport,
  ValidationSeverity,
} from "@/lib/aquarium-validation";

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
  flowRateGph?: number | null;
  imageUrl?: string | null;
  productCategory?: ProductCategory;
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

const stockingStatusTones: Record<StockingStatus, StatusTone> = {
  "lightly-stocked": "success",
  "moderately-stocked": "info",
  "fully-stocked": "warning",
  overstocked: "critical",
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
    href: "/aquarium-builder/products/lighting",
  },
  {
    kind: "repeatable",
    category: "substrate",
    label: "Substrate",
    action: "Choose Substrate",
    addAnotherAction: "Add Another Substrate",
    href: "/aquarium-builder/products/substrate",
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

function parseFlowRateGph(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const match = value.match(/(\d+(?:\.\d+)?)\s*GPH/i);
  const parsedValue = match ? Number(match[1]) : null;

  return parsedValue != null && Number.isFinite(parsedValue) && parsedValue > 0
    ? parsedValue
    : null;
}

function getSavedBuild() {
  return parseAquariumBuild(
    window.localStorage.getItem(AQUARIUM_BUILDER_STORAGE_KEY),
  );
}

function toBuilderSelection(
  equipment: AquariumEquipmentProduct,
  build: AquariumBuild,
): BuilderComponentSelection {
  return {
    name: equipment.name,
    summary: equipment.notes ?? undefined,
    quantity: equipment.quantity,
    estimatedPrice: equipment.estimatedPrice,
    flowRateGph: equipment.flowRateGph ?? parseFlowRateGph(equipment.notes),
    imageUrl: equipment.imageUrl,
    productCategory: getProductCategoryForEquipment(equipment.category),
    tank:
      equipment.category === "tank" && build.tank.sizeGallons > 0
        ? { sizeGallons: build.tank.sizeGallons }
        : undefined,
  };
}

function getProductCategoryForEquipment(
  category: AquariumEquipmentProduct["category"],
): ProductCategory | undefined {
  if (category === "tank") {
    return "tanks";
  }

  if (category === "filter") {
    return "filters";
  }

  if (category === "heater") {
    return "heaters";
  }

  if (category === "lighting") {
    return "lighting";
  }

  if (category === "substrate") {
    return "substrate";
  }

  if (category === "hardscape") {
    return "decor";
  }

  return undefined;
}

function getEquipmentCategoryForSingleSelection(
  category: SingleSelectionCategory,
): AquariumEquipmentProduct["category"] {
  if (category === "tank") {
    return "tank";
  }

  if (category === "filtration") {
    return "filter";
  }

  if (category === "heating") {
    return "heater";
  }

  return "lighting";
}

function getEquipmentCategoryForRepeatableSelection(
  category: RepeatableSelectionCategory,
): AquariumEquipmentProduct["category"] | null {
  if (category === "substrate") {
    return "substrate";
  }

  if (category === "decor") {
    return "hardscape";
  }

  return null;
}

function getInitialSingleSelections(build: AquariumBuild): SingleSelections {
  const selections: SingleSelections = {};

  for (const equipment of build.equipment) {
    if (equipment.category === "tank") {
      selections.tank = toBuilderSelection(equipment, build);
    }

    if (equipment.category === "filter") {
      selections.filtration = toBuilderSelection(equipment, build);
    }

    if (equipment.category === "heater") {
      selections.heating = toBuilderSelection(equipment, build);
    }

    if (equipment.category === "lighting") {
      selections.lighting = toBuilderSelection(equipment, build);
    }
  }

  return selections;
}

function getInitialRepeatableSelections(build: AquariumBuild): RepeatableSelections {
  const selections: RepeatableSelections = {};

  for (const equipment of build.equipment) {
    if (equipment.category === "substrate") {
      selections.substrate = [
        ...(selections.substrate ?? []),
        toBuilderSelection(equipment, build),
      ];
    }

    if (equipment.category === "hardscape") {
      selections.decor = [
        ...(selections.decor ?? []),
        toBuilderSelection(equipment, build),
      ];
    }
  }

  return selections;
}

export function AquariumBuilderInterface({
  plantCatalog,
  species,
}: {
  plantCatalog: Plant[];
  species: AquariumSpecies[];
}) {
  const [build, setBuild] = useState<AquariumBuild>(defaultAquariumBuild);
  const [singleSelections, setSingleSelections] = useState<SingleSelections>(
    () => getInitialSingleSelections(defaultAquariumBuild),
  );
  const [repeatableSelections, setRepeatableSelections] =
    useState<RepeatableSelections>(() =>
      getInitialRepeatableSelections(defaultAquariumBuild),
    );
  const [builderLoaded, setBuilderLoaded] = useState(false);
  const [validationReport, setValidationReport] =
    useState<AquariumValidationReport | null>(null);
  const [validationLoading, setValidationLoading] = useState(false);
  const [validationUnavailable, setValidationUnavailable] = useState(false);
  const validationRequestId = useRef(0);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const savedBuild = getSavedBuild();

      setBuild(savedBuild);
      setSingleSelections(getInitialSingleSelections(savedBuild));
      setRepeatableSelections(getInitialRepeatableSelections(savedBuild));
      setBuilderLoaded(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const tankSizeGallons =
    singleSelections.tank?.tank?.sizeGallons ??
    (build.tank.sizeGallons > 0 ? build.tank.sizeGallons : null);
  const selectedFlowRateGph =
    singleSelections.filtration?.flowRateGph ?? null;
  const filtrationLevel = singleSelections.filtration
    ? deriveAquariumFiltrationLevel(build)
    : null;
  const derivedPlantedLevel = deriveAquariumPlantedLevel(build);
  const plantedLevel =
    derivedPlantedLevel !== "none" ? derivedPlantedLevel : null;
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
  const plantsById = useMemo(() => {
    return new Map(plantCatalog.map((plant) => [plant.id, plant]));
  }, [plantCatalog]);
  const livestockSpeciesBySlug = useMemo(() => {
    return new Map(species.map((item) => [item.slug, item]));
  }, [species]);
  const livestockSpeciesById = useMemo(() => {
    return new Map(species.map((item) => [item.id, item]));
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

  const stockingAnalysis = useMemo(() => {
    return analyzeStocking(normalizeStockingAnalysisInput(build, species));
  }, [build, species]);
  useEffect(() => {
    if (!builderLoaded) {
      return;
    }

    const requestId = validationRequestId.current + 1;
    validationRequestId.current = requestId;

    const timeoutId = window.setTimeout(() => {
      setValidationLoading(true);
      setValidationUnavailable(false);
      void runAquariumBuilderValidation(build, stockingAnalysis)
        .then((report) => {
          if (validationRequestId.current !== requestId) {
            return;
          }

          setValidationReport(report);
          setValidationLoading(false);
        })
        .catch(() => {
          if (validationRequestId.current !== requestId) {
            return;
          }

          setValidationUnavailable(true);
          setValidationLoading(false);
        });
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [build, builderLoaded, stockingAnalysis]);

  const validationDisplay = getValidationDisplayState(
    validationReport,
    validationLoading,
    validationUnavailable,
  );
  const compatibilityDisplay = getCompatibilityDisplayState(
    validationReport,
    validationLoading,
    validationUnavailable,
  );
  const stockingStatusLabel =
    STOCKING_STATUS_LABELS[stockingAnalysis.stockingStatus];
  const stockingStatusValue =
    stockingAnalysis.baseCapacity <= 0
      ? "— · Select a tank"
      : `${Math.round(stockingAnalysis.stockingPercentage)}% · ${stockingStatusLabel}${stockingAnalysis.analysisComplete ? "" : " (incomplete)"}`;

  const flowEstimateGph = useMemo(() => {
    return (
      selectedFlowRateGph ?? estimateFlowGph(tankSizeGallons, filtrationLevel)
    );
  }, [filtrationLevel, selectedFlowRateGph, tankSizeGallons]);

  const builderStatus = [
    {
      label: "Compatibility",
      value: compatibilityDisplay.label,
      tone: compatibilityDisplay.tone,
      icon: CircleHelp,
      className: "lg:flex-[2]",
    },
    {
      label: "Stocking",
      value: stockingStatusValue,
      tone:
        stockingAnalysis.baseCapacity > 0
          ? stockingStatusTones[stockingAnalysis.stockingStatus]
          : "neutral",
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

  function updateBuildEquipment(
    equipment: AquariumEquipmentProduct[],
    tankOverride?: AquariumBuild["tank"],
  ) {
    const nextBuild: AquariumBuild = {
      ...build,
      tank: tankOverride ?? build.tank,
      equipment,
      equipmentProductIds: deriveAquariumEquipmentProductSelections(equipment),
      updatedAt: new Date().toISOString(),
    };

    setBuild(nextBuild);
    window.localStorage.setItem(
      AQUARIUM_BUILDER_STORAGE_KEY,
      serializeAquariumBuild(nextBuild),
    );
  }

  function clearSingleSelection(category: SingleSelectionCategory) {
    const equipmentCategory = getEquipmentCategoryForSingleSelection(category);
    const nextEquipment = build.equipment.filter((equipment) => {
      return equipment.category !== equipmentCategory;
    });
    const nextTank =
      category === "tank"
        ? {
            ...build.tank,
            sizeGallons: 0,
          }
        : build.tank;

    updateBuildEquipment(nextEquipment, nextTank);
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
    const equipmentCategory = getEquipmentCategoryForRepeatableSelection(category);

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

    if (equipmentCategory) {
      let matchingIndex = -1;
      const nextEquipment = build.equipment.filter((equipment) => {
        if (equipment.category !== equipmentCategory) {
          return true;
        }

        matchingIndex += 1;

        return matchingIndex !== index;
      });

      updateBuildEquipment(nextEquipment);
    }
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

      <StockingAnalysisPanel analysis={stockingAnalysis} />

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
                        plantsById={plantsById}
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

      <StockingAnalysisPanel analysis={stockingAnalysis} />

      <AquariumValidationPanel
        report={validationReport}
        isLoading={validationLoading}
        isUnavailable={validationUnavailable}
        overallLabel={validationDisplay.overallLabel}
        overallTone={validationDisplay.tone}
        speciesById={livestockSpeciesById}
      />

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
                {build.plants.map((entry) => {
                  const plant = plantsById.get(entry.plantId);

                  return (
                  <li
                    key={entry.plantId}
                    className="border border-border bg-background p-3"
                  >
                    <div className="font-medium">
                      {plant?.commonName ?? "Unavailable plant"}
                    </div>
                    {plant ? (
                      <div className="mt-1 text-xs italic text-muted-foreground">
                        {plant.scientificName}
                      </div>
                    ) : null}
                    <div className="mt-1 text-xs text-muted-foreground">
                      Quantity: {entry.quantity}
                    </div>
                  </li>
                  );
                })}
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

function formatAnalysisUnits(value: number) {
  return `${value.toFixed(1)} units`;
}

const validationSeverityClasses: Record<ValidationSeverity, string> = {
  error: "border-destructive/50 bg-destructive/5",
  warning: "border-amber-500/50 bg-amber-500/5",
  info: "border-sky-500/50 bg-sky-500/5",
};

function AquariumValidationPanel({
  report,
  isLoading,
  isUnavailable,
  overallLabel,
  overallTone,
  speciesById,
}: {
  report: AquariumValidationReport | null;
  isLoading: boolean;
  isUnavailable: boolean;
  overallLabel: string;
  overallTone: StatusTone;
  speciesById: Map<string, AquariumSpecies>;
}) {
  return (
    <section
      className="mt-6 border border-border bg-card"
      aria-labelledby="aquarium-validation-heading"
      aria-live="polite"
      aria-busy={isLoading}
    >
      <div className="border-b border-border p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="aquarium-validation-heading" className="text-lg font-semibold">
              Aquarium Validation
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Checks the complete livestock group, tank, water requirements,
              behavior, and stocking level.
            </p>
          </div>
          <span
            className={`px-2.5 py-1 text-sm font-semibold ${statusToneClasses[overallTone]}`}
          >
            {overallLabel}
          </span>
        </div>

        <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-sm sm:max-w-md">
          <ValidationCount label="Errors" value={report?.summary.errorCount ?? 0} />
          <ValidationCount label="Warnings" value={report?.summary.warningCount ?? 0} />
          <ValidationCount label="Info" value={report?.summary.infoCount ?? 0} />
        </dl>
      </div>

      {isUnavailable ? (
        <p className="p-4 text-sm text-muted-foreground">
          Validation is temporarily unavailable. Your builder selections are
          still saved; change a selection to retry.
        </p>
      ) : isLoading && !report ? (
        <p className="p-4 text-sm text-muted-foreground">Checking this build...</p>
      ) : report?.issues.length ? (
        <ul className="space-y-3 p-4">
          {report.issues.map((issue) => {
            const affectedSpecies = issue.affectedSpeciesIds.map(
              (id) => speciesById.get(id)?.common_name ?? id,
            );

            return (
              <li
                key={issue.id}
                className={`border p-3 text-sm ${validationSeverityClasses[issue.severity]}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{issue.title}</span>
                  <span className="text-xs font-bold uppercase tracking-wide">
                    {issue.severity}
                  </span>
                </div>
                <p className="mt-1">{issue.message}</p>
                {affectedSpecies.length > 0 ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      Affected species:
                    </span>{" "}
                    {affectedSpecies.join(", ")}
                  </p>
                ) : null}
                {issue.recommendation ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      Recommendation:
                    </span>{" "}
                    {issue.recommendation}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : report ? (
        <p className="p-4 text-sm">
          No validation findings for the current build.
        </p>
      ) : (
        <p className="p-4 text-sm text-muted-foreground">
          Validation will run after the saved build loads.
        </p>
      )}
    </section>
  );
}

function ValidationCount({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-border bg-background px-2 py-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function StockingAnalysisPanel({
  analysis,
}: {
  analysis: StockingAnalysisResult;
}) {
  const hasTank = analysis.baseCapacity > 0;
  const statusLabel = STOCKING_STATUS_LABELS[analysis.stockingStatus];
  const estimatedRemaining =
    analysis.estimatedLivestockRemaining == null
      ? "Not enough calculated livestock data"
      : `About ${analysis.estimatedLivestockRemaining} similar ${analysis.estimatedLivestockRemaining === 1 ? "animal" : "animals"}`;

  return (
    <section
      className="mt-6 border border-border bg-card"
      aria-labelledby="stocking-analysis-heading"
      aria-live="polite"
    >
      <div className="border-b border-border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="stocking-analysis-heading" className="text-lg font-semibold">
            Stocking Analysis
          </h2>
          <span className="text-sm font-semibold">
            {hasTank
              ? `${Math.round(analysis.stockingPercentage)}% · ${statusLabel}`
              : "Select a tank"}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Estimated capacity based on tank volume, filtration, planting, and
          available species bioload scores.
        </p>
      </div>

      {hasTank ? (
        <div className="grid gap-6 p-4 text-sm md:grid-cols-2">
          <dl className="space-y-2">
            <BreakdownRow
              label="Total bioload"
              value={formatAnalysisUnits(analysis.totalBioload)}
            />
            <BreakdownRow
              label="Effective capacity"
              value={formatAnalysisUnits(analysis.effectiveCapacity)}
            />
            <BreakdownRow
              label="Stocking utilization"
              value={`${Math.round(analysis.stockingPercentage)}%`}
            />
            <BreakdownRow
              label="Remaining capacity"
              value={formatAnalysisUnits(analysis.remainingCapacity)}
            />
            {analysis.capacityExceededBy > 0 ? (
              <BreakdownRow
                label="Capacity exceeded by"
                value={formatAnalysisUnits(analysis.capacityExceededBy)}
              />
            ) : null}
          </dl>

          <div>
            <h3 className="font-semibold">Estimated capacity remaining</h3>
            <p className="mt-2">{estimatedRemaining}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              This estimate uses the average bioload of calculated livestock.
              It is not an exact safe additional-fish count.
            </p>
          </div>
        </div>
      ) : (
        <p className="p-4 text-sm text-muted-foreground">
          Select a tank with an exact gallon capacity to calculate stocking.
        </p>
      )}

      {analysis.warnings.length > 0 ? (
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="size-4" aria-hidden="true" />
            {analysis.analysisComplete
              ? "Stocking warnings"
              : "Stocking analysis incomplete"}
          </div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {analysis.warnings.map((warning) => (
              <li key={warning.code}>
                <span className="font-medium capitalize">
                  {warning.severity}:
                </span>{" "}
                {warning.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
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
        <div className="flex items-center gap-3">
          <ProductThumbnail
            alt={selection.name}
            category={selection.productCategory}
            imageUrl={selection.imageUrl}
            size="sm"
          />
          <div className="min-w-0">
            <div className="font-medium">{selection.name}</div>
            {selection.summary ? (
              <div className="mt-1 text-xs text-muted-foreground">
                {selection.summary}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex items-center">
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
  plantsById,
  summary,
}: {
  action: string;
  href: string;
  plants: AquariumPlantEntry[];
  plantsById: Map<string, Plant>;
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
            .map((entry) => {
              const plant = plantsById.get(entry.plantId);
              return `${plant?.commonName ?? "Unavailable plant"} x${entry.quantity}`;
            })
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
            <div className="flex items-center gap-3">
              <ProductThumbnail
                alt={selection.name}
                category={selection.productCategory}
                imageUrl={selection.imageUrl}
                size="sm"
              />
              <div className="min-w-0">
                <div className="font-medium">{selection.name}</div>
                {selection.summary ? (
                  <div className="mt-1 text-xs text-muted-foreground">
                    {selection.summary}
                  </div>
                ) : null}
              </div>
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

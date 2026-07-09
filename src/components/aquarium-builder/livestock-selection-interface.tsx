"use client";

import { Minus, Plus, Search, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  AquariumBuild,
  AquariumLivestockEntry,
  AquariumSpecies,
} from "@/lib/aquarium-builder/types";
import {
  AQUARIUM_BUILDER_STORAGE_KEY,
  defaultAquariumBuild,
  parseAquariumBuild,
  serializeAquariumBuild,
} from "@/lib/aquarium-builder/storage";
import { calculateCompatibility } from "@/lib/compatibility/engine";
import { getSpeciesImage } from "@/lib/images";

type LivestockSelectionInterfaceProps = {
  species: AquariumSpecies[];
};

type FilterState = {
  compatibleOnly: boolean;
  maxTankGallons: string;
  careLevel: string;
  temperament: string;
  schooling: "all" | "schooling" | "solo";
};

const defaultFilters: FilterState = {
  compatibleOnly: true,
  maxTankGallons: "",
  careLevel: "all",
  temperament: "all",
  schooling: "all",
};

const pageSize = 45;

function formatRange(
  min: number | null | undefined,
  max: number | null | undefined,
  suffix = "",
) {
  if (min != null && max != null) {
    return `${min}-${max}${suffix}`;
  }

  if (min != null) {
    return `${min}${suffix}+`;
  }

  if (max != null) {
    return `Up to ${max}${suffix}`;
  }

  return "Unknown";
}

function formatMinimumTankSize(value: number | null) {
  return value ? `${value} gal` : "Unknown";
}

function getSpeciesSearchText(species: AquariumSpecies) {
  return [
    species.common_name,
    species.scientific_name,
    species.family,
    species.temperament,
    species.care_level,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function getUniqueOptions(values: Array<string | null>) {
  return Array.from(new Set(values.filter((value): value is string => !!value)))
    .sort((a, b) => a.localeCompare(b));
}

function getStarterCompatibilityScore(species: AquariumSpecies) {
  let score = 0;

  if (species.care_level === "Easy") score += 30;
  if (species.temperament === "Peaceful") score += 25;
  if ((species.tank_size_gal ?? 999) <= 20) score += 20;
  if ((species.aggression_level ?? 0) <= 1) score += 10;
  if (species.invert_safe !== false) score += 5;
  if (species.plant_safe !== false) score += 5;
  if (species.min_temp_f != null && species.max_temp_f != null) score += 3;
  if (species.min_ph != null && species.max_ph != null) score += 2;

  return score;
}

function getCompatibilityScore(
  candidate: AquariumSpecies,
  selectedLivestock: AquariumLivestockEntry[],
  speciesBySlug: Map<string, AquariumSpecies>,
) {
  const selectedSpecies = selectedLivestock
    .map((entry) => speciesBySlug.get(entry.speciesSlug))
    .filter((item): item is AquariumSpecies => !!item);

  if (selectedSpecies.length === 0) {
    return getStarterCompatibilityScore(candidate);
  }

  const scores = selectedSpecies.map((selectedItem) => {
    return calculateCompatibility(candidate, selectedItem).score;
  });

  return Math.round(
    scores.reduce((total, score) => total + score, 0) / scores.length,
  );
}

function updateLivestockEntry(
  livestock: AquariumLivestockEntry[],
  speciesSlug: string,
  quantity: number,
) {
  const safeQuantity = Math.max(1, Math.floor(quantity));
  const existingEntry = livestock.find(
    (entry) => entry.speciesSlug === speciesSlug,
  );

  if (existingEntry) {
    return livestock.map((entry) => {
      if (entry.speciesSlug !== speciesSlug) {
        return entry;
      }

      return {
        ...entry,
        quantity: safeQuantity,
      };
    });
  }

  return [
    ...livestock,
    {
      speciesSlug,
      quantity: safeQuantity,
      notes: null,
    },
  ];
}

function getCompatibilityLabel(score: number, hasLivestock: boolean) {
  if (!hasLivestock) {
    return score >= 80 ? "Best start" : score >= 55 ? "Good start" : "Review";
  }

  if (score >= 90) return "Very compatible";
  if (score >= 70) return "Compatible";
  if (score >= 50) return "Caution";

  return "Poor fit";
}

function getCompatibilityClass(score: number, hasLivestock: boolean) {
  if (!hasLivestock) {
    return score >= 55 ? "text-emerald-700" : "text-amber-700";
  }

  if (score >= 70) return "text-emerald-700";
  if (score >= 50) return "text-amber-700";

  return "text-destructive";
}

function SpeciesThumbnail({
  commonName,
  slug,
}: {
  commonName: string;
  slug: string;
}) {
  const [preview, setPreview] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const imageSrc = getSpeciesImage(slug);

  return (
    <>
      <div
        className="relative size-10 shrink-0 overflow-hidden border border-border bg-muted"
        onMouseEnter={(event) =>
          setPreview({
            x: event.clientX,
            y: event.clientY,
          })
        }
        onMouseMove={(event) =>
          setPreview({
            x: event.clientX,
            y: event.clientY,
          })
        }
        onMouseLeave={() => setPreview(null)}
      >
        <Image
          src={imageSrc}
          alt={`${commonName} aquarium species thumbnail`}
          fill
          className="object-contain p-1"
          sizes="40px"
        />
      </div>

      {preview ? (
        <div
          className="pointer-events-none fixed z-50 hidden border border-border bg-card p-3 shadow-xl md:block"
          style={{
            left: preview.x + 16,
            top: preview.y - 80,
          }}
        >
          <div className="relative size-40">
            <Image
              src={imageSrc}
              alt={`${commonName} aquarium species preview`}
              fill
              className="object-contain"
              sizes="160px"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

export function LivestockSelectionInterface({
  species,
}: LivestockSelectionInterfaceProps) {
  const [build, setBuild] = useState<AquariumBuild>(() => {
    if (typeof window === "undefined") {
      return defaultAquariumBuild;
    }

    return parseAquariumBuild(
      window.localStorage.getItem(AQUARIUM_BUILDER_STORAGE_KEY),
    );
  });
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [pendingSpeciesSlug, setPendingSpeciesSlug] = useState<string | null>(
    null,
  );
  const [pendingQuantity, setPendingQuantity] = useState(1);
  const [resultsPage, setResultsPage] = useState(1);
  const router = useRouter();

  useEffect(() => {
    window.localStorage.setItem(
      AQUARIUM_BUILDER_STORAGE_KEY,
      serializeAquariumBuild(build),
    );
  }, [build]);

  const speciesBySlug = useMemo(() => {
    return new Map(species.map((item) => [item.slug, item]));
  }, [species]);
  const selectedSpeciesSlugs = useMemo(() => {
    return new Set(build.livestock.map((entry) => entry.speciesSlug));
  }, [build.livestock]);
  const careLevels = useMemo(() => {
    return getUniqueOptions(species.map((item) => item.care_level));
  }, [species]);
  const temperaments = useMemo(() => {
    return getUniqueOptions(species.map((item) => item.temperament));
  }, [species]);
  const tankSizeFromBuild =
    build.tank.sizeGallons > 0 ? String(build.tank.sizeGallons) : "";
  const normalizedQuery = query.trim().toLowerCase();
  const maxTankGallons = Number(filters.maxTankGallons);
  const hasSelectedLivestock = build.livestock.length > 0;
  const totalAnimals = build.livestock.reduce((total, entry) => {
    return total + entry.quantity;
  }, 0);
  const pendingSpecies = pendingSpeciesSlug
    ? speciesBySlug.get(pendingSpeciesSlug)
    : null;

  const rankedSpecies = useMemo(() => {
    const candidates = species
      .map((item) => ({
        item,
        compatibilityScore: getCompatibilityScore(
          item,
          build.livestock,
          speciesBySlug,
        ),
      }))
      .filter(({ item }) => {
        if (selectedSpeciesSlugs.has(item.slug)) {
          return false;
        }

        if (
          normalizedQuery &&
          !getSpeciesSearchText(item).includes(normalizedQuery)
        ) {
          return false;
        }

        if (
          Number.isFinite(maxTankGallons) &&
          maxTankGallons > 0 &&
          item.tank_size_gal != null &&
          item.tank_size_gal > maxTankGallons
        ) {
          return false;
        }

        if (filters.careLevel !== "all" && item.care_level !== filters.careLevel) {
          return false;
        }

        if (
          filters.temperament !== "all" &&
          item.temperament !== filters.temperament
        ) {
          return false;
        }

        if (filters.schooling === "schooling" && !item.schooling) {
          return false;
        }

        if (filters.schooling === "solo" && item.schooling) {
          return false;
        }

        return true;
      });
    const compatibleCandidates =
      filters.compatibleOnly && hasSelectedLivestock
        ? candidates.filter(({ compatibilityScore }) => compatibilityScore >= 50)
        : candidates;
    const visibleCandidates =
      compatibleCandidates.length > 0 ? compatibleCandidates : candidates;

    return visibleCandidates.sort((a, b) => {
      if (b.compatibilityScore !== a.compatibilityScore) {
        return b.compatibilityScore - a.compatibilityScore;
      }

      return a.item.common_name.localeCompare(b.item.common_name);
    });
  }, [
    build.livestock,
    filters,
    hasSelectedLivestock,
    maxTankGallons,
    normalizedQuery,
    selectedSpeciesSlugs,
    species,
    speciesBySlug,
  ]);
  const totalPages = Math.max(Math.ceil(rankedSpecies.length / pageSize), 1);
  const currentPage = Math.min(resultsPage, totalPages);
  const paginatedSpecies = rankedSpecies.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const firstVisibleResult =
    rankedSpecies.length > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const lastVisibleResult = Math.min(currentPage * pageSize, rankedSpecies.length);

  function updateBuildLivestock(livestock: AquariumLivestockEntry[]) {
    setBuild((currentBuild) => ({
      ...currentBuild,
      livestock,
      updatedAt: new Date().toISOString(),
    }));
  }

  function openQuantityConfirm(speciesSlug: string) {
    setPendingSpeciesSlug(speciesSlug);
    setPendingQuantity(1);
  }

  function confirmSpeciesQuantity() {
    if (!pendingSpeciesSlug) {
      return;
    }

    const nextBuild: AquariumBuild = {
      ...build,
      livestock: updateLivestockEntry(
        build.livestock,
        pendingSpeciesSlug,
        pendingQuantity,
      ),
      updatedAt: new Date().toISOString(),
    };

    window.localStorage.setItem(
      AQUARIUM_BUILDER_STORAGE_KEY,
      serializeAquariumBuild(nextBuild),
    );
    setBuild(nextBuild);
    router.push("/aquarium-builder");
  }

  function setQuantity(speciesSlug: string, quantity: number) {
    updateBuildLivestock(
      updateLivestockEntry(build.livestock, speciesSlug, quantity),
    );
  }

  function removeSpecies(speciesSlug: string) {
    updateBuildLivestock(
      build.livestock.filter((entry) => entry.speciesSlug !== speciesSlug),
    );
  }

  function updateFilters(nextFilters: Partial<FilterState>) {
    setResultsPage(1);
    setFilters((currentFilters) => ({
      ...currentFilters,
      ...nextFilters,
    }));
  }

  return (
    <section className="mt-6">
      <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="min-w-0 space-y-5">
          <div className="border border-border bg-card p-4">
            <div className="text-center text-sm font-bold">Livestock List</div>

            <label className="mt-4 flex items-center gap-2 border border-border bg-background px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={filters.compatibleOnly}
                onChange={(event) =>
                  updateFilters({ compatibleOnly: event.target.checked })
                }
                className="size-4"
              />
              Compatibility Filter
            </label>

            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs font-bold uppercase">Species</dt>
                <dd className="text-lg font-bold text-sky-700">
                  {build.livestock.length}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase">Animals</dt>
                <dd className="text-lg font-bold text-sky-700">
                  {totalAnimals}
                </dd>
              </div>
            </dl>

            <Button asChild variant="outline" size="sm" className="mt-4 w-full">
              <Link href="/aquarium-builder">Return to Builder</Link>
            </Button>
          </div>

          <div className="border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <h2 className="font-semibold">Current Livestock</h2>
            </div>

            {build.livestock.length > 0 ? (
              <ul className="divide-y divide-border">
                {build.livestock.map((entry) => {
                  const item = speciesBySlug.get(entry.speciesSlug);
                  const label = item?.common_name ?? entry.speciesSlug;

                  return (
                    <li key={entry.speciesSlug} className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <SpeciesThumbnail
                            commonName={label}
                            slug={entry.speciesSlug}
                          />
                          <div className="min-w-0">
                            <div className="text-sm font-semibold">{label}</div>
                            {item?.scientific_name ? (
                              <div className="text-xs italic text-muted-foreground">
                                {item.scientific_name}
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`Remove ${label}`}
                          onClick={() => removeSpecies(entry.speciesSlug)}
                        >
                          <Trash2 className="size-3.5" aria-hidden="true" />
                        </Button>
                      </div>

                      <div className="mt-2 flex items-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-xs"
                          aria-label={`Decrease ${label} quantity`}
                          disabled={entry.quantity <= 1}
                          onClick={() =>
                            setQuantity(entry.speciesSlug, entry.quantity - 1)
                          }
                        >
                          <Minus className="size-3" aria-hidden="true" />
                        </Button>
                        <Input
                          type="number"
                          min={1}
                          step={1}
                          value={entry.quantity}
                          aria-label={`${label} quantity`}
                          className="h-7 w-16 text-center text-sm"
                          onChange={(event) =>
                            setQuantity(
                              entry.speciesSlug,
                              Number(event.target.value),
                            )
                          }
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-xs"
                          aria-label={`Increase ${label} quantity`}
                          onClick={() =>
                            setQuantity(entry.speciesSlug, entry.quantity + 1)
                          }
                        >
                          <Plus className="size-3" aria-hidden="true" />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="p-4 text-sm text-muted-foreground">
                No livestock selected.
              </p>
            )}
          </div>

          <div className="border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <h2 className="font-semibold">Filters</h2>
            </div>

            <div className="space-y-4 p-4 text-sm">
              <FilterField label="Tank Size">
                <Input
                  type="number"
                  min={1}
                  value={filters.maxTankGallons}
                  placeholder={tankSizeFromBuild || "Gallons"}
                  onChange={(event) =>
                    updateFilters({ maxTankGallons: event.target.value })
                  }
                />
              </FilterField>

              <FilterField label="Care Level">
                <select
                  value={filters.careLevel}
                  onChange={(event) =>
                    updateFilters({ careLevel: event.target.value })
                  }
                  className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
                >
                  <option value="all">All</option>
                  {careLevels.map((careLevel) => (
                    <option key={careLevel} value={careLevel}>
                      {careLevel}
                    </option>
                  ))}
                </select>
              </FilterField>

              <FilterField label="Temperament">
                <select
                  value={filters.temperament}
                  onChange={(event) =>
                    updateFilters({ temperament: event.target.value })
                  }
                  className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
                >
                  <option value="all">All</option>
                  {temperaments.map((temperament) => (
                    <option key={temperament} value={temperament}>
                      {temperament}
                    </option>
                  ))}
                </select>
              </FilterField>

              <FilterField label="Group Behavior">
                <select
                  value={filters.schooling}
                  onChange={(event) =>
                    updateFilters({
                      schooling: event.target.value as FilterState["schooling"],
                    })
                  }
                  className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
                >
                  <option value="all">All</option>
                  <option value="schooling">Schooling/group</option>
                  <option value="solo">Solo/pair</option>
                </select>
              </FilterField>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  setResultsPage(1);
                  setFilters(defaultFilters);
                }}
              >
                Reset Filters
              </Button>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mb-3 flex flex-col gap-3 border-b border-border pb-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold">
                {rankedSpecies.length}{" "}
                {filters.compatibleOnly ? "Compatible Species" : "Species"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Available species are sorted by{" "}
                {hasSelectedLivestock
                  ? "compatibility with selected livestock"
                  : "starter compatibility"}
                .
                {rankedSpecies.length > 0
                  ? ` Showing ${firstVisibleResult}-${lastVisibleResult} of ${rankedSpecies.length}.`
                  : ""}
              </p>
            </div>

            <div className="flex w-full items-center gap-2 md:w-80">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <Input
                id="livestock-search"
                value={query}
                onChange={(event) => {
                  setResultsPage(1);
                  setQuery(event.target.value);
                }}
                placeholder="Search species"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-border bg-card">
            <table className="w-full min-w-[760px] table-fixed border-collapse text-sm">
              <thead className="bg-muted text-left text-xs">
                <tr>
                  <th className="w-[27%] px-2 py-2 font-semibold">Name</th>
                  <th className="w-[13%] px-2 py-2 font-semibold">Compat.</th>
                  <th className="w-[9%] px-2 py-2 font-semibold">Tank</th>
                  <th className="w-[12%] px-2 py-2 font-semibold">Temp</th>
                  <th className="w-[13%] px-2 py-2 font-semibold">Temper.</th>
                  <th className="w-[9%] px-2 py-2 font-semibold">Care</th>
                  <th className="w-[9%] px-2 py-2 font-semibold">Group</th>
                  <th className="w-[8%] py-2 pl-2 pr-4 text-right font-semibold">
                    Add
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedSpecies.map(({ item, compatibilityScore }) => (
                  <tr key={item.slug} className="border-t border-border">
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-3">
                        <SpeciesThumbnail
                          commonName={item.common_name}
                          slug={item.slug}
                        />
                        <div className="min-w-0">
                          <Link
                            href={`/piscidex/${item.slug}`}
                            className="font-semibold underline-offset-4 hover:underline"
                          >
                            {item.common_name}
                          </Link>
                          <div className="text-xs italic text-muted-foreground">
                            {item.scientific_name ?? "Unknown"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <div
                        className={[
                          "font-semibold",
                          getCompatibilityClass(
                            compatibilityScore,
                            hasSelectedLivestock,
                          ),
                        ].join(" ")}
                      >
                        {compatibilityScore}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {getCompatibilityLabel(
                          compatibilityScore,
                          hasSelectedLivestock,
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      {formatMinimumTankSize(item.tank_size_gal)}
                    </td>
                    <td className="px-2 py-2">
                      {formatRange(item.min_temp_f, item.max_temp_f, " F")}
                    </td>
                    <td className="px-2 py-2">
                      {item.temperament ?? "Unknown"}
                    </td>
                    <td className="px-2 py-2">{item.care_level ?? "Unknown"}</td>
                    <td className="px-2 py-2">
                      {item.schooling
                        ? `Group ${item.min_group_size ?? "?"}+`
                        : "Solo/pair"}
                    </td>
                    <td className="py-2 pl-2 pr-4 text-right">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => openQuantityConfirm(item.slug)}
                      >
                        Add
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {rankedSpecies.length === 0 ? (
              <div className="border-t border-border p-6 text-sm text-muted-foreground">
                No unselected species match the current filters.
              </div>
            ) : null}
          </div>

          {rankedSpecies.length > pageSize ? (
            <nav
              className="mt-3 flex items-center justify-between gap-3 text-sm"
              aria-label="Species results pagination"
            >
              <Button
                type="button"
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setResultsPage(currentPage - 1)}
              >
                Previous
              </Button>

              <span className="text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>

              <Button
                type="button"
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => setResultsPage(currentPage + 1)}
              >
                Next
              </Button>
            </nav>
          ) : null}
        </div>
      </div>

      {pendingSpecies ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4">
          <div className="w-full max-w-sm border border-border bg-card p-5 shadow-lg">
            <h2 className="text-lg font-semibold">Add Species</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Choose how many {pendingSpecies.common_name} to add to the
              aquarium build. Quantity starts at 1.
            </p>

            <label className="mt-4 block text-sm font-medium">
              Quantity
              <Input
                type="number"
                min={1}
                step={1}
                value={pendingQuantity}
                className="mt-2"
                autoFocus
                onChange={(event) =>
                  setPendingQuantity(
                    Math.max(1, Math.floor(Number(event.target.value) || 1)),
                  )
                }
              />
            </label>

            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPendingSpeciesSlug(null)}
              >
                Cancel
              </Button>
              <Button type="button" onClick={confirmSpeciesQuantity}>
                Add to Builder
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function FilterField({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase">{label}</span>
      <span className="mt-2 block">{children}</span>
    </label>
  );
}

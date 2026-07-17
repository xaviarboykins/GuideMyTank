"use client";

import { Minus, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  removeAquariumPlantEntry,
  updateAquariumPlantEntry,
} from "@/lib/aquarium-builder/plants";
import {
  AQUARIUM_BUILDER_STORAGE_KEY,
  defaultAquariumBuild,
  parseAquariumBuild,
  serializeAquariumBuild,
} from "@/lib/aquarium-builder/storage";
import type { AquariumBuild } from "@/lib/aquarium-builder/types";
import type { Plant } from "@/lib/plants/types";

export function PlantsSelectionInterface({ plants }: { plants: Plant[] }) {
  const router = useRouter();
  const [build, setBuild] = useState<AquariumBuild>(() => {
    if (typeof window === "undefined") {
      return defaultAquariumBuild;
    }

    return parseAquariumBuild(
      window.localStorage.getItem(AQUARIUM_BUILDER_STORAGE_KEY),
    );
  });
  const [query, setQuery] = useState("");
  const [pendingPlantId, setPendingPlantId] = useState<string | null>(null);
  const [pendingQuantity, setPendingQuantity] = useState(1);
  const plantsById = useMemo(
    () => new Map(plants.map((plant) => [plant.id, plant])),
    [plants],
  );
  const filteredPlants = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    if (!normalizedQuery) {
      return plants;
    }

    return plants.filter((plant) => {
      return (
        plant.commonName.toLocaleLowerCase().includes(normalizedQuery) ||
        plant.scientificName.toLocaleLowerCase().includes(normalizedQuery)
      );
    });
  }, [plants, query]);
  const pendingPlant = pendingPlantId
    ? plantsById.get(pendingPlantId) ?? null
    : null;

  useEffect(() => {
    window.localStorage.setItem(
      AQUARIUM_BUILDER_STORAGE_KEY,
      serializeAquariumBuild(build),
    );
  }, [build]);

  const totalPlants = build.plants.reduce((total, entry) => {
    return total + entry.quantity;
  }, 0);

  function updateBuildPlants(nextPlants: AquariumBuild["plants"]) {
    setBuild((currentBuild) => ({
      ...currentBuild,
      plants: nextPlants,
      updatedAt: new Date().toISOString(),
    }));
  }

  function openQuantityDialog(plantId: string) {
    const selectedPlant = build.plants.find(
      (entry) => entry.plantId === plantId,
    );

    setPendingPlantId(plantId);
    setPendingQuantity(selectedPlant?.quantity ?? 1);
  }

  function confirmPlantQuantity() {
    if (!pendingPlantId) {
      return;
    }

    const nextBuild: AquariumBuild = {
      ...build,
      plants: updateAquariumPlantEntry(
        build.plants,
        pendingPlantId,
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

  function setQuantity(plantId: string, quantity: number) {
    updateBuildPlants(
      updateAquariumPlantEntry(build.plants, plantId, quantity),
    );
  }

  function removePlant(plantId: string) {
    updateBuildPlants(removeAquariumPlantEntry(build.plants, plantId));
  }

  return (
    <section className="mt-6">
      <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="min-w-0 space-y-5">
          <div className="border border-border bg-card p-4">
            <div className="text-center text-sm font-bold">Plant List</div>

            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs font-bold uppercase">Types</dt>
                <dd className="text-lg font-bold text-sky-700">
                  {build.plants.length}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase">Plants</dt>
                <dd className="text-lg font-bold text-sky-700">
                  {totalPlants}
                </dd>
              </div>
            </dl>

            <Button asChild variant="outline" size="sm" className="mt-4 w-full">
              <Link href="/aquarium-builder">Return to Builder</Link>
            </Button>
          </div>

          <div className="border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <h2 className="font-semibold">Current Plants</h2>
            </div>

            {build.plants.length > 0 ? (
              <ul className="divide-y divide-border">
                {build.plants.map((entry) => {
                  const plant = plantsById.get(entry.plantId);
                  const label = plant?.commonName ?? "Unavailable plant";

                  return (
                    <li key={entry.plantId} className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold">{label}</div>
                          {plant ? (
                            <div className="truncate text-xs italic text-muted-foreground">
                              {plant.scientificName}
                            </div>
                          ) : null}
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`Remove ${label}`}
                          onClick={() => removePlant(entry.plantId)}
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
                            setQuantity(entry.plantId, entry.quantity - 1)
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
                            setQuantity(entry.plantId, Number(event.target.value))
                          }
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-xs"
                          aria-label={`Increase ${label} quantity`}
                          onClick={() =>
                            setQuantity(entry.plantId, entry.quantity + 1)
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
                No plants selected.
              </p>
            )}
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mb-3 flex flex-col gap-3 border-b border-border pb-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold">
                {filteredPlants.length} Aquatic Plants
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Search the active freshwater plant catalog by common or
                scientific name.
              </p>
            </div>

            <div className="flex w-full items-center gap-2 md:w-80">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <Input
                id="plant-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search plants"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-border bg-card">
            <table className="w-full min-w-[760px] table-fixed border-collapse text-sm">
              <thead className="bg-muted text-left text-xs">
                <tr>
                  <th className="w-[28%] px-2 py-2 font-semibold">Name</th>
                  <th className="w-[14%] px-2 py-2 font-semibold">Difficulty</th>
                  <th className="w-[13%] px-2 py-2 font-semibold">Light</th>
                  <th className="w-[13%] px-2 py-2 font-semibold">CO2</th>
                  <th className="w-[14%] px-2 py-2 font-semibold">Placement</th>
                  <th className="w-[10%] px-2 py-2 font-semibold">Growth</th>
                  <th className="w-[8%] py-2 pl-2 pr-4 text-right font-semibold">
                    Add
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPlants.map((plant) => {
                  const selected = build.plants.some(
                    (entry) => entry.plantId === plant.id,
                  );

                  return (
                    <tr key={plant.id} className="border-t border-border">
                      <td className="px-2 py-2">
                        <div className="font-semibold">{plant.commonName}</div>
                        <div className="text-xs italic text-muted-foreground">
                          {plant.scientificName}
                        </div>
                      </td>
                      <td className="px-2 py-2">{formatLabel(plant.careLevel)}</td>
                      <td className="px-2 py-2">
                        {formatLightRange(
                          plant.minimumLightLevel,
                          plant.maximumLightLevel,
                        )}
                      </td>
                      <td className="px-2 py-2">
                        {plant.co2Required ? "Required" : "Not required"}
                      </td>
                      <td className="px-2 py-2">
                        {formatLabel(plant.placement)}
                      </td>
                      <td className="px-2 py-2">
                        {formatLabel(plant.growthRate)}
                      </td>
                      <td className="py-2 pl-2 pr-4 text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant={selected ? "outline" : "default"}
                          onClick={() => openQuantityDialog(plant.id)}
                        >
                          {selected ? "Edit" : "Add"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredPlants.length === 0 ? (
              <div className="border-t border-border p-6 text-sm text-muted-foreground">
                No plants match that search.
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {pendingPlant ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4">
          <div className="w-full max-w-sm border border-border bg-card p-5 shadow-lg">
            <h2 className="text-lg font-semibold">
              {build.plants.some((entry) => entry.plantId === pendingPlant.id)
                ? "Edit Plant"
                : "Add Plant"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Choose how many {pendingPlant.commonName} plants to include.
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
                onClick={() => setPendingPlantId(null)}
              >
                Cancel
              </Button>
              <Button type="button" onClick={confirmPlantQuantity}>
                Save to Builder
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function formatLabel(value: string | null) {
  if (!value) {
    return "Unknown";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatLightRange(minimum: string | null, maximum: string | null) {
  if (!minimum && !maximum) {
    return "Unknown";
  }

  if (!minimum || minimum === maximum) {
    return formatLabel(maximum ?? minimum);
  }

  if (!maximum) {
    return `${formatLabel(minimum)}+`;
  }

  return `${formatLabel(minimum)}-${formatLabel(maximum)}`;
}

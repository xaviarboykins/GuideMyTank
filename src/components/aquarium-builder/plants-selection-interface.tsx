"use client";

import { Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AquariumBuild } from "@/lib/aquarium-builder/types";
import {
  AQUARIUM_BUILDER_STORAGE_KEY,
  defaultAquariumBuild,
  parseAquariumBuild,
  serializeAquariumBuild,
} from "@/lib/aquarium-builder/storage";

const pageSize = 45;

export function PlantsSelectionInterface() {
  const [build, setBuild] = useState<AquariumBuild>(() => {
    if (typeof window === "undefined") {
      return defaultAquariumBuild;
    }

    return parseAquariumBuild(
      window.localStorage.getItem(AQUARIUM_BUILDER_STORAGE_KEY),
    );
  });
  const [query, setQuery] = useState("");

  useEffect(() => {
    window.localStorage.setItem(
      AQUARIUM_BUILDER_STORAGE_KEY,
      serializeAquariumBuild(build),
    );
  }, [build]);

  const totalPlants = build.plants.reduce((total, entry) => {
    return total + entry.quantity;
  }, 0);

  function removePlant(plantSlug: string) {
    setBuild((currentBuild) => ({
      ...currentBuild,
      plants: currentBuild.plants.filter((entry) => {
        return entry.plantSlug !== plantSlug;
      }),
      updatedAt: new Date().toISOString(),
    }));
  }

  return (
    <section className="mt-6">
      <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
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
                {build.plants.map((entry) => (
                  <li key={entry.plantSlug} className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold">
                          {entry.plantSlug}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Quantity: {entry.quantity}
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`Remove ${entry.plantSlug}`}
                        onClick={() => removePlant(entry.plantSlug)}
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-4 text-sm text-muted-foreground">
                No plants selected.
              </p>
            )}
          </div>

          <div className="border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <h2 className="font-semibold">Filters</h2>
            </div>

            <div className="space-y-4 p-4 text-sm">
              <DisabledFilter label="Lighting" />
              <DisabledFilter label="CO2" />
              <DisabledFilter label="Placement" />
              <DisabledFilter label="Difficulty" />
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mb-3 flex flex-col gap-3 border-b border-border pb-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold">0 Aquatic Plants</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Showing 0-0 of 0. Connect an aquatic plants table to populate
                this selector.
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
              <tbody />
            </table>

            <div className="border-t border-border p-6 text-sm text-muted-foreground">
              No aquatic plant records are available yet. This page is wired for
              the builder flow and ready for a future plants table.
            </div>
          </div>

          <nav
            className="mt-3 flex items-center justify-between gap-3 text-sm"
            aria-label="Plant results pagination"
          >
            <Button type="button" variant="outline" disabled>
              Previous
            </Button>

            <span className="text-muted-foreground">
              Page 1 of {Math.max(Math.ceil(0 / pageSize), 1)}
            </span>

            <Button type="button" variant="outline" disabled>
              Next
            </Button>
          </nav>
        </div>
      </div>
    </section>
  );
}

function DisabledFilter({ label }: { label: string }) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase">{label}</span>
      <select
        disabled
        className="mt-2 h-8 w-full rounded-lg border border-input bg-muted px-2 text-sm text-muted-foreground"
      >
        <option>Database needed</option>
      </select>
    </label>
  );
}

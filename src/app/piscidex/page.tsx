import type { Metadata } from "next";
import Link from "next/link";

import { PageContainer } from "@/components/site/page-container";
import { PageHeader } from "@/components/site/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  getAllSpecies,
  getFilteredSpecies,
  parsePisciDexFilters,
  type PisciDexFilterSearchParams,
} from "@/lib/data/species";

import { SpeciesPaginatedTable } from "@/components/species/species-paginated-table";

type PisciDexPageProps = {
  searchParams: Promise<PisciDexFilterSearchParams>;
};

const tankSizeOptions = [5, 10, 20, 29, 40, 55, 75, 100];

function getUniqueValues(values: Array<string | null>) {
  return Array.from(new Set(values.filter(Boolean))).sort() as string[];
}

export const metadata: Metadata = {
  title: "PisciDex | Freshwater Fish Species Database | GuideMyTank",
  description:
    "Browse freshwater aquarium fish species, care requirements, tank size, temperament, diet, and compatibility data.",
};

export const revalidate = 86400;

export default async function PisciDexPage({
  searchParams,
}: PisciDexPageProps) {
  const filters = parsePisciDexFilters(await searchParams);
  const [species, allSpecies] = await Promise.all([
    getFilteredSpecies(filters),
    getAllSpecies(),
  ]);

  const temperamentOptions = getUniqueValues(
    allSpecies.map((item) => item.temperament),
  );
  const difficultyOptions = getUniqueValues(
    allSpecies.map((item) => item.care_level),
  );

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Species Database"
        title="PisciDex"
        description="Browse freshwater fish species, tank requirements, temperament data, care level, diet, and compatibility information."
      />

      <form
        action="/piscidex"
        method="get"
        className="mt-6 border border-border bg-card p-4"
      >
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-6">
          <label className="space-y-1 lg:col-span-2">
            <span className="text-sm font-medium">Search</span>
            <Input
              name="q"
              defaultValue={filters.query}
              placeholder="Common, scientific, or family"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium">Tank size</span>
            <select
              name="tank"
              defaultValue={filters.tankSizeGallons ?? ""}
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 py-1 text-sm"
            >
              <option value="">Any</option>
              {tankSizeOptions.map((gallons) => (
                <option key={gallons} value={gallons}>
                  {gallons} gal
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium">Temperament</span>
            <select
              name="temperament"
              defaultValue={filters.temperament ?? ""}
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 py-1 text-sm"
            >
              <option value="">Any</option>
              {temperamentOptions.map((temperament) => (
                <option key={temperament} value={temperament}>
                  {temperament}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium">Difficulty</span>
            <select
              name="difficulty"
              defaultValue={filters.difficulty ?? ""}
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 py-1 text-sm"
            >
              <option value="">Any</option>
              {difficultyOptions.map((difficulty) => (
                <option key={difficulty} value={difficulty}>
                  {difficulty}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium">Water type</span>
            <select
              name="waterType"
              defaultValue={filters.waterType ?? ""}
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 py-1 text-sm"
            >
              <option value="">Any</option>
              <option value="freshwater">Freshwater</option>
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="beginner"
              value="true"
              defaultChecked={filters.beginnerFriendly}
              className="size-4 rounded border-input"
            />
            Beginner-friendly
          </label>

          <div className="flex gap-2">
            <Button type="submit">Apply filters</Button>
            <Button asChild type="button" variant="outline">
              <Link href="/piscidex">Clear filters</Link>
            </Button>
          </div>
        </div>
      </form>

      <section className="mt-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-lg font-semibold">Species Results</h2>
        </div>

        <SpeciesPaginatedTable
          species={species}
          totalSpeciesCount={allSpecies.length}
        />
      </section>
    </PageContainer>
  );
}

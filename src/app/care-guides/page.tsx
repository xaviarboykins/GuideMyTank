import type { Metadata } from "next";
import Link from "next/link";

import { PageContainer } from "@/components/site/page-container";
import { PageHeader } from "@/components/site/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listPublishedCareGuides } from "@/lib/care-guides/service";
import { createPublishedContentImageSignedUrls } from "@/lib/content-images/service";
import { parsePisciDexFilters, type PisciDexFilterSearchParams } from "@/lib/data/species";

type CareGuidesPageProps = {
  searchParams: Promise<PisciDexFilterSearchParams>;
};

const tankSizeOptions = [5, 10, 20, 29, 40, 55, 75, 100];

function getUniqueValues(values: Array<string | null>) {
  return Array.from(new Set(values.filter(Boolean))).sort() as string[];
}

export const metadata: Metadata = {
  title: "Freshwater Fish Care Guides | GuideMyTank",
  description:
    "Browse and filter freshwater fish care guides by tank size, temperament, and difficulty.",
};

export const revalidate = 86400;

export default async function CareGuidesPage({
  searchParams,
}: CareGuidesPageProps) {
  const filters = parsePisciDexFilters(await searchParams);
  const allGuides = await listPublishedCareGuides();
  const allSpecies = allGuides.map((guide) => guide.species);
  const normalizedQuery = filters.query?.toLowerCase();
  const guides = allGuides.filter((guide) => {
    const species = guide.species;
    if (normalizedQuery && ![guide.title, guide.slug, species.common_name, species.scientific_name, species.family].some((value) => value?.toLowerCase().includes(normalizedQuery))) return false;
    if (filters.tankSizeGallons && (!species.tank_size_gal || species.tank_size_gal > filters.tankSizeGallons)) return false;
    if (filters.temperament && species.temperament !== filters.temperament) return false;
    if (filters.difficulty && species.care_level !== filters.difficulty) return false;
    if (filters.beginnerFriendly && species.care_level !== "Easy") return false;
    return true;
  });
  const primaryImages = allGuides.map((guide) => guide.care_guide_images.find((image) => image.is_primary) ?? guide.care_guide_images[0]).filter(Boolean);
  const imageUrls = await createPublishedContentImageSignedUrls(primaryImages.map((image) => image.content_images.storage_path));
  const temperamentOptions = getUniqueValues(
    allSpecies.map((item) => item.temperament),
  );
  const difficultyOptions = getUniqueValues(
    allSpecies.map((item) => item.care_level),
  );

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Freshwater Species Library"
        title="Aquarium Care Guides"
        description="Find practical freshwater fish profiles covering tank size, water parameters, temperament, diet, group size, and compatible tank mates."
      />

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="border border-border bg-card p-4 lg:sticky lg:top-4">
          <h2 className="font-semibold">Filter Care Guides</h2>
          <form action="/care-guides" method="get" className="mt-4 space-y-4">
            <label className="block space-y-1">
              <span className="text-sm font-medium">Search</span>
              <Input
                name="q"
                defaultValue={filters.query}
                placeholder="Name or family"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-medium">Tank size</span>
              <select
                name="tank"
                defaultValue={filters.tankSizeGallons ?? ""}
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
              >
                <option value="">Any size</option>
                {tankSizeOptions.map((gallons) => (
                  <option key={gallons} value={gallons}>
                    Up to {gallons} gallons
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-medium">Temperament</span>
              <select
                name="temperament"
                defaultValue={filters.temperament ?? ""}
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
              >
                <option value="">Any temperament</option>
                {temperamentOptions.map((temperament) => (
                  <option key={temperament} value={temperament}>
                    {temperament}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-medium">Care difficulty</span>
              <select
                name="difficulty"
                defaultValue={filters.difficulty ?? ""}
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
              >
                <option value="">Any difficulty</option>
                {difficultyOptions.map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="beginner"
                value="true"
                defaultChecked={filters.beginnerFriendly}
                className="size-4 rounded border-input"
              />
              Beginner-friendly only
            </label>

            <div className="grid gap-2">
              <Button type="submit">Apply Filters</Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/care-guides">Clear Filters</Link>
              </Button>
            </div>
          </form>
        </aside>

        <section aria-labelledby="care-guide-results">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 id="care-guide-results" className="text-xl font-semibold">
                Fish Care Guide Rolodex
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Showing {guides.length} of {allGuides.length} published guides
              </p>
            </div>
          </div>

          {guides.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {guides.map((guide) => {
                const item = guide.species;
                const primaryImage = guide.care_guide_images.find((image) => image.is_primary) ?? guide.care_guide_images[0];
                const imageUrl = primaryImage ? imageUrls.get(primaryImage.content_images.storage_path) : undefined;
                return (
                <article
                  key={guide.id}
                  className="overflow-hidden rounded-lg border border-border bg-card"
                >
                  <Link
                    href={`/care-guides/${guide.slug}`}
                    className="group flex h-full flex-col"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                      {imageUrl ? (
                        // Signed private-storage URLs are not stable Next Image optimization sources.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imageUrl} alt={primaryImage?.content_images.alt_text ?? `${item.common_name} care guide`} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                      ) : null}
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <h3 className="font-semibold group-hover:underline">
                        {guide.title}
                      </h3>
                      <p className="mt-1 text-xs italic text-muted-foreground">
                        {item.scientific_name}
                      </p>
                      <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
                        {guide.summary ?? item.summary ?? "Freshwater aquarium care requirements and compatibility profile."}
                      </p>
                      <dl className="mt-auto grid grid-cols-3 gap-2 border-t border-border pt-4 text-xs">
                        <div>
                          <dt className="text-muted-foreground">Care</dt>
                          <dd className="mt-1 font-medium">
                            {item.care_level ?? "Unknown"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Tank</dt>
                          <dd className="mt-1 font-medium">
                            {item.tank_size_gal
                              ? `${item.tank_size_gal}+ gal`
                              : "Unknown"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Nature</dt>
                          <dd className="mt-1 truncate font-medium">
                            {item.temperament ?? "Unknown"}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </Link>
                </article>
              );})}
            </div>
          ) : (
            <div className="border border-border bg-card p-8 text-center">
              <h3 className="font-semibold">No care guides found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Try removing a filter or searching for another species.
              </p>
              <Button className="mt-4" variant="outline" asChild>
                <Link href="/care-guides">Clear Filters</Link>
              </Button>
            </div>
          )}
        </section>
      </div>
    </PageContainer>
  );
}

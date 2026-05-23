import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

type Species = {
  id: string;
  slug: string;
  common_name: string;
  scientific_name: string | null;
  category: string | null;
};

export const revalidate = 86400;

export default async function SpeciesIndexPage() {
  const supabase = await createClient();

  const { data: species, error } = await supabase
    .from("species")
    .select(
      `
      id,
      slug,
      common_name,
      scientific_name,
      category
    `,
    )
    .order("common_name", { ascending: true });

  if (error) {
    console.error(error);
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Species Index</h1>

        <p className="mt-2 text-muted-foreground">
          Browse aquarium species for tank planning and compatibility.
        </p>
      </div>

      {!species || species.length === 0 ? (
        <div className="rounded border p-6">
          <p>No species available yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {species.map((fish: Species) => (
            <Link
              key={fish.id}
              href={`/species/${fish.slug}`}
              className="rounded border p-4 transition hover:bg-muted"
            >
              <div className="space-y-2">
                <div>
                  <h2 className="font-semibold">{fish.common_name}</h2>

                  {fish.scientific_name && (
                    <p className="text-sm italic text-muted-foreground">
                      {fish.scientific_name}
                    </p>
                  )}
                </div>

                {fish.category && (
                  <div className="text-sm text-muted-foreground">
                    Category: {fish.category}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

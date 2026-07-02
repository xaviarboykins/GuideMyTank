import Link from "next/link";

import type { Database } from "@/types/database.types";

type Species = Database["public"]["Tables"]["species"]["Row"];

type SpeciesTableProps = {
  species: Species[];
};

export function SpeciesTable({ species }: SpeciesTableProps) {
  if (species.length === 0) {
    return (
      <div className="mt-3 rounded-lg border bg-card p-6 text-sm text-muted-foreground">
        No species match the current filters.
      </div>
    );
  }

  return (
    <div className="mt-3 overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="bg-muted text-left">
          <tr>
            <th className="p-3">Common Name</th>
            <th className="p-3">Scientific Name</th>
            <th className="p-3">Temperament</th>
            <th className="p-3">Care</th>
            <th className="p-3">Min Tank</th>
          </tr>
        </thead>

        <tbody>
          {species.map((item) => (
            <tr key={item.id} className="border-t">
              <td className="p-3 font-medium">
                <Link
                  href={`/piscidex/${item.slug}`}
                  className="underline-offset-4 hover:underline"
                >
                  {item.common_name}
                </Link>
              </td>

              <td className="p-3 italic text-muted-foreground">
                {item.scientific_name ?? "—"}
              </td>

              <td className="p-3">{item.temperament ?? "—"}</td>
              <td className="p-3">{item.care_level ?? "—"}</td>

              <td className="p-3">
                {item.min_tank_gallons ? `${item.min_tank_gallons} gal` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

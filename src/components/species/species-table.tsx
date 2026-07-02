import Link from "next/link";

import type { Database } from "@/types/database.types";

type Species = Database["public"]["Tables"]["species"]["Row"];

type SpeciesTableProps = {
  species: Species[];
};

function formatNumber(value: number | null | undefined, suffix = "") {
  return value ? `${value}${suffix}` : "Unknown";
}

function formatRange(
  min: number | null | undefined,
  max: number | null | undefined,
  suffix = "",
) {
  if (min && max) {
    return `${min}-${max}${suffix}`;
  }

  return "Unknown";
}

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
      <table className="w-full min-w-[1120px] text-sm">
        <thead className="bg-muted text-left">
          <tr>
            <th className="p-3">Common Name</th>
            <th className="p-3">Scientific Name</th>
            <th className="p-3">Tank</th>
            <th className="p-3">Size</th>
            <th className="p-3">Group</th>
            <th className="p-3">Temp</th>
            <th className="p-3">pH</th>
            <th className="p-3">Temper.</th>
            <th className="p-3">Care</th>
            <th className="p-3">Bioload</th>
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
                {item.scientific_name ?? "Unknown"}
              </td>

              <td className="p-3">
                {formatNumber(item.tank_size_gal, " gal")}
              </td>

              <td className="p-3">
                {formatNumber(item.max_size_inches, '"')}
              </td>

              <td className="p-3">
                {item.schooling
                  ? formatNumber(item.min_group_size)
                  : "Solo/pair"}
              </td>

              <td className="p-3">
                {formatRange(item.min_temp_f, item.max_temp_f, " F")}
              </td>

              <td className="p-3">{formatRange(item.min_ph, item.max_ph)}</td>
              <td className="p-3">{item.temperament ?? "Unknown"}</td>
              <td className="p-3">{item.care_level ?? "Unknown"}</td>

              <td className="p-3">
                {item.bioload_rating ? `${item.bioload_rating}/10` : "Unknown"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

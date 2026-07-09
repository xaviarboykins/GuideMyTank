"use client";

import Image from "next/image";
import Link from "next/link";

import { useState } from "react";

import type { Database } from "@/types/database.types";
import { getSpeciesImage } from "@/lib/images";
import { formatSpeciesGroupLabel } from "@/lib/species/group-label";
import { formatRecommendedTemperature } from "@/lib/species/temperature-label";

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
  const [preview, setPreview] = useState<{
    slug: string;
    commonName: string;
    x: number;
    y: number;
  } | null>(null);

  if (species.length === 0) {
    return (
      <div className="mt-3 rounded-lg border bg-card p-6 text-sm text-muted-foreground">
        No species match the current filters.
      </div>
    );
  }

  return (
    <div className="mt-3 overflow-visible rounded-lg border">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] text-sm">
          <thead className="bg-muted text-left">
            <tr>
              <th className="p-3">Species</th>
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
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="relative size-10 shrink-0 overflow-hidden border border-border bg-muted"
                      onMouseEnter={(event) =>
                        setPreview({
                          slug: item.slug,
                          commonName: item.common_name,
                          x: event.clientX,
                          y: event.clientY,
                        })
                      }
                      onMouseMove={(event) =>
                        setPreview((currentPreview) =>
                          currentPreview
                            ? {
                                ...currentPreview,
                                x: event.clientX,
                                y: event.clientY,
                              }
                            : null,
                        )
                      }
                      onMouseLeave={() => setPreview(null)}
                    >
                      <Image
                        src={getSpeciesImage(item.slug)}
                        alt={`${item.common_name} aquarium species thumbnail`}
                        fill
                        className="object-contain p-1"
                        sizes="40px"
                      />
                    </div>

                    <Link
                      href={`/piscidex/${item.slug}`}
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      {item.common_name}
                    </Link>
                  </div>
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
                  {formatSpeciesGroupLabel(item)}
                </td>

                <td className="p-3">
                  {formatRecommendedTemperature(item)}
                </td>

                <td className="p-3">{formatRange(item.min_ph, item.max_ph)}</td>
                <td className="p-3">{item.temperament ?? "Unknown"}</td>
                <td className="p-3">{item.care_level ?? "Unknown"}</td>

                <td className="p-3">
                  {item.bioload_rating
                    ? `${item.bioload_rating}/10`
                    : "Unknown"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {preview ? (
          <div
            className="pointer-events-none fixed z-50 hidden rounded-lg border bg-card p-3 shadow-xl md:block"
            style={{
              left: preview.x + 16,
              top: preview.y - 80,
            }}
          >
            <div className="relative h-40 w-40">
              <Image
                src={getSpeciesImage(preview.slug)}
                alt={`${preview.commonName} aquarium species preview`}
                fill
                className="object-contain"
                sizes="160px"
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

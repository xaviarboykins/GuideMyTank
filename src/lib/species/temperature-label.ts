import type { Database } from "@/types/database.types";

type SpeciesTemperatureFields = Pick<
  Database["public"]["Tables"]["species"]["Row"],
  | "max_temp_f"
  | "min_temp_f"
  | "recommended_max_temp_f"
  | "recommended_min_temp_f"
  | "tolerated_max_temp_f"
  | "tolerated_min_temp_f"
>;

function formatRange(
  min: number | null | undefined,
  max: number | null | undefined,
  suffix = "",
) {
  if (min != null && max != null) {
    return `${min}-${max}${suffix}`;
  }

  return null;
}

export function formatRecommendedTemperature(species: SpeciesTemperatureFields) {
  return (
    formatRange(
      species.recommended_min_temp_f ?? species.min_temp_f,
      species.recommended_max_temp_f ?? species.max_temp_f,
      " F",
    ) ?? "Unknown"
  );
}

export function formatToleratedTemperature(species: SpeciesTemperatureFields) {
  return (
    formatRange(
      species.tolerated_min_temp_f ?? species.min_temp_f,
      species.tolerated_max_temp_f ?? species.max_temp_f,
      " F",
    ) ?? "Unknown"
  );
}

export function hasDifferentToleratedTemperature(
  species: SpeciesTemperatureFields,
) {
  const recommended = formatRecommendedTemperature(species);
  const tolerated = formatToleratedTemperature(species);

  return recommended !== "Unknown" && tolerated !== "Unknown" && recommended !== tolerated;
}

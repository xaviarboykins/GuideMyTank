import type { Database } from "@/types/database.types";

type SpeciesGroupFields = Pick<
  Database["public"]["Tables"]["species"]["Row"],
  | "bonded_pair_suitable"
  | "min_group_size"
  | "schooling"
  | "scientific_name"
  | "slug"
>;

const bondedPairSuitableFallbackSlugs = new Set(["angelfish"]);
const bondedPairSuitableFallbackScientificNames = new Set([
  "pterophyllum scalare",
]);

function isBondedPairSuitable(species: SpeciesGroupFields) {
  return (
    species.bonded_pair_suitable === true ||
    bondedPairSuitableFallbackSlugs.has(species.slug) ||
    bondedPairSuitableFallbackScientificNames.has(
      species.scientific_name.toLowerCase(),
    )
  );
}

export function formatSpeciesGroupLabel(species: SpeciesGroupFields) {
  if (species.schooling) {
    return species.min_group_size
      ? `Group ${species.min_group_size}+`
      : "Group recommended";
  }

  if (species.min_group_size && species.min_group_size > 1) {
    return `Pair/group ${species.min_group_size}+`;
  }

  if (isBondedPairSuitable(species)) {
    return "Solo/bonded pair";
  }

  return "Solo";
}

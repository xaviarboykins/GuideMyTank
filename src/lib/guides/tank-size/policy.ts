import type {
  TankSizeGuideData,
  TankSizeGuideInput,
  TankSizeSuitability,
} from "./types";

function isCommunityCandidate(
  species: TankSizeGuideData["species"][number],
) {
  return (
    !species.species_only_preferred &&
    (species.compatibility_tags.includes("community") ||
      species.temperament?.toLowerCase() === "peaceful")
  );
}

export function evaluateTankSizeSuitability(
  data: TankSizeGuideData,
  input: TankSizeGuideInput,
): TankSizeSuitability {
  const result: TankSizeSuitability = {
    suitable: [],
    excludedMissingStockingProfile: [],
    excludedSpecialist: [],
    excludedByVariation: [],
  };

  for (const species of data.species) {
    if (
      species.tank_size_gal == null ||
      species.tank_size_gal > input.gallons
    ) {
      continue;
    }

    if (species.specialist_setup) {
      result.excludedSpecialist.push(species);
      continue;
    }

    if (species.bioload_rating == null) {
      result.excludedMissingStockingProfile.push(species);
      continue;
    }

    if (input.variation === "community" && !isCommunityCandidate(species)) {
      result.excludedByVariation.push(species);
      continue;
    }

    result.suitable.push(species);
  }

  for (const group of Object.values(result)) {
    group.sort((a, b) => a.common_name.localeCompare(b.common_name));
  }

  return result;
}


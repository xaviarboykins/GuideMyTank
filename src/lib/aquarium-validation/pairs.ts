import type { AquariumResolvedLivestockEntry } from "@/lib/aquarium-builder/types";

import type { AquariumSpeciesPair } from "./types";

export function getAquariumSpeciesPairKey(
  speciesAId: string,
  speciesBId: string,
) {
  return [speciesAId, speciesBId]
    .sort((idA, idB) => idA.localeCompare(idB))
    .join(":");
}

export function generateUniqueSpeciesPairs(
  livestock: AquariumResolvedLivestockEntry[],
): AquariumSpeciesPair[] {
  const uniqueSpecies = new Map<string, AquariumResolvedLivestockEntry>();

  for (const entry of livestock) {
    if (!uniqueSpecies.has(entry.species.id)) {
      uniqueSpecies.set(entry.species.id, entry);
    }
  }

  const species = Array.from(uniqueSpecies.values()).sort((entryA, entryB) =>
    entryA.species.id.localeCompare(entryB.species.id),
  );
  const pairs: AquariumSpeciesPair[] = [];

  for (let index = 0; index < species.length; index += 1) {
    for (
      let relatedIndex = index + 1;
      relatedIndex < species.length;
      relatedIndex += 1
    ) {
      const speciesA = species[index];
      const speciesB = species[relatedIndex];

      pairs.push({
        speciesA,
        speciesB,
        key: getAquariumSpeciesPairKey(
          speciesA.species.id,
          speciesB.species.id,
        ),
      });
    }
  }

  return pairs;
}

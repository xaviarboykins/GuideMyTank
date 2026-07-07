export const COMPATIBILITY_BASE_URL = "https://guidemytank.com";

export type CompatibilityPair = {
  speciesA: string;
  speciesB: string;
};

export function getCanonicalCompatibilityPair(
  speciesA: string,
  speciesB: string,
): CompatibilityPair {
  const [canonicalSpeciesA, canonicalSpeciesB] = [speciesA, speciesB].sort();

  return {
    speciesA: canonicalSpeciesA,
    speciesB: canonicalSpeciesB,
  };
}

export function isCanonicalCompatibilityPair(
  speciesA: string,
  speciesB: string,
) {
  const canonicalPair = getCanonicalCompatibilityPair(speciesA, speciesB);

  return (
    canonicalPair.speciesA === speciesA && canonicalPair.speciesB === speciesB
  );
}

export function getCompatibilityPath(speciesA: string, speciesB: string) {
  const canonicalPair = getCanonicalCompatibilityPair(speciesA, speciesB);

  return `/compatibility/${canonicalPair.speciesA}/${canonicalPair.speciesB}`;
}

export function getCompatibilityUrl(speciesA: string, speciesB: string) {
  return `${COMPATIBILITY_BASE_URL}${getCompatibilityPath(speciesA, speciesB)}`;
}

export function generateCanonicalCompatibilityPairs(
  species: { slug: string }[],
): CompatibilityPair[] {
  const pairs: CompatibilityPair[] = [];

  for (let i = 0; i < species.length; i += 1) {
    for (let j = i + 1; j < species.length; j += 1) {
      pairs.push(
        getCanonicalCompatibilityPair(species[i].slug, species[j].slug),
      );
    }
  }

  return pairs;
}

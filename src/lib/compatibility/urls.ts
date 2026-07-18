import { getSiteUrl } from "../seo/site-url";

export type CompatibilityPair = {
  speciesA: string;
  speciesB: string;
};

export function isCompatibilitySitemapSegment(value: string) {
  return value === "sitemap";
}

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
  return getSiteUrl(getCompatibilityPath(speciesA, speciesB));
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

export function getCanonicalCompatibilityPairCount(speciesCount: number) {
  return speciesCount > 1 ? (speciesCount * (speciesCount - 1)) / 2 : 0;
}

export function generateCanonicalCompatibilityPairBatch(
  species: { slug: string }[],
  offset: number,
  limit: number,
): CompatibilityPair[] {
  if (offset < 0 || limit < 1) {
    return [];
  }

  const sortedSpecies = [...species].sort((a, b) =>
    a.slug.localeCompare(b.slug),
  );
  const pairs: CompatibilityPair[] = [];
  let pairIndex = 0;

  for (let i = 0; i < sortedSpecies.length; i += 1) {
    for (let j = i + 1; j < sortedSpecies.length; j += 1) {
      if (pairIndex >= offset) {
        pairs.push({
          speciesA: sortedSpecies[i].slug,
          speciesB: sortedSpecies[j].slug,
        });
      }

      pairIndex += 1;

      if (pairs.length === limit) {
        return pairs;
      }
    }
  }

  return pairs;
}

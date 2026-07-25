import { getCanonicalCompatibilityPair } from "../../compatibility/urls";
import {
  MAX_RELATED_COMPATIBILITY_REPORTS,
  MAX_SHARED_SPECIES_REPORTS,
} from "./constants";
import { resolveInternalLinkPath } from "./route-resolver";
import type {
  CompatibilityReportCandidate,
  CompatibilityReportSpecies,
  InternalLinkItem,
  RelatedCompatibilityOptions,
} from "./types";

function getPairKey(speciesASlug: string, speciesBSlug: string) {
  const pair = getCanonicalCompatibilityPair(speciesASlug, speciesBSlug);

  return `${pair.speciesA}|${pair.speciesB}`;
}

function getLimit(value: number | undefined, defaultValue: number) {
  if (value === undefined) {
    return defaultValue;
  }

  return Number.isFinite(value) && value > 0
    ? Math.min(Math.floor(value), defaultValue)
    : 0;
}

function compareLinks(a: InternalLinkItem, b: InternalLinkItem) {
  return (
    (b.score ?? 0) - (a.score ?? 0) ||
    a.title.localeCompare(b.title) ||
    a.href.localeCompare(b.href)
  );
}

function createLink(
  candidate: CompatibilityReportCandidate,
): InternalLinkItem | null {
  const href = resolveInternalLinkPath({
    entityType: "compatibility-report",
    speciesASlug: candidate.speciesA.slug,
    speciesBSlug: candidate.speciesB.slug,
  });

  if (!href) {
    return null;
  }

  const species = [candidate.speciesA, candidate.speciesB].sort((a, b) =>
    a.slug.localeCompare(b.slug),
  );

  return {
    entityType: "compatibility-report",
    entityId: getPairKey(species[0].slug, species[1].slug),
    title: `${species[0].name} and ${species[1].name} Compatibility`,
    href,
    description: `Compatibility report for ${species[0].name} and ${species[1].name}.`,
    relationship: "related-compatibility",
    score: candidate.score,
  };
}

function sharesSpecies(
  candidate: CompatibilityReportCandidate,
  species: CompatibilityReportSpecies,
) {
  return (
    candidate.speciesA.entityId === species.entityId ||
    candidate.speciesB.entityId === species.entityId ||
    candidate.speciesA.slug === species.slug ||
    candidate.speciesB.slug === species.slug
  );
}

export function getRelatedCompatibilityReports(
  current: CompatibilityReportCandidate,
  candidates: CompatibilityReportCandidate[],
  options: RelatedCompatibilityOptions = {},
): InternalLinkItem[] {
  const limit = getLimit(
    options.limit,
    MAX_RELATED_COMPATIBILITY_REPORTS,
  );
  const sharedSpeciesLimit = getLimit(
    options.sharedSpeciesLimit,
    MAX_SHARED_SPECIES_REPORTS,
  );

  if (limit === 0 || sharedSpeciesLimit === 0) {
    return [];
  }

  const currentPairKey = getPairKey(
    current.speciesA.slug,
    current.speciesB.slug,
  );
  const linksForSpeciesA: InternalLinkItem[] = [];
  const linksForSpeciesB: InternalLinkItem[] = [];
  const linksByPair = new Map<
    string,
    { link: InternalLinkItem; sharesSpeciesA: boolean }
  >();

  for (const candidate of candidates) {
    if (
      candidate.availability === "draft" ||
      candidate.availability === "archived"
    ) {
      continue;
    }

    const pairKey = getPairKey(
      candidate.speciesA.slug,
      candidate.speciesB.slug,
    );

    if (pairKey === currentPairKey) {
      continue;
    }

    const sharesSpeciesA = sharesSpecies(candidate, current.speciesA);
    const sharesSpeciesB = sharesSpecies(candidate, current.speciesB);

    if (!sharesSpeciesA && !sharesSpeciesB) {
      continue;
    }

    const link = createLink(candidate);

    if (!link) {
      continue;
    }

    const existing = linksByPair.get(pairKey);

    if (!existing || compareLinks(link, existing.link) < 0) {
      linksByPair.set(pairKey, { link, sharesSpeciesA });
    }
  }

  for (const { link, sharesSpeciesA } of linksByPair.values()) {
    if (sharesSpeciesA) {
      linksForSpeciesA.push(link);
    } else {
      linksForSpeciesB.push(link);
    }
  }

  const selectedLinks = [
    ...linksForSpeciesA.sort(compareLinks).slice(0, sharedSpeciesLimit),
    ...linksForSpeciesB.sort(compareLinks).slice(0, sharedSpeciesLimit),
  ];

  return selectedLinks.sort(compareLinks).slice(0, limit);
}

import { filterInternalLinkItems } from "./duplicate-filter";
import { getRelatedCompatibilityReports } from "./related-compatibility";
import { resolveRelatedContent } from "./related-content";
import { resolveInternalLinkPath } from "./route-resolver";
import {
  getMatchingTopicClusters,
  resolveTopicClusterHub,
} from "./topic-cluster-service";
import type {
  CompatibilityReportCandidate,
  CompatibilityReportSpecies,
  InternalLinkItem,
  RelatedContentCandidate,
} from "./types";

export interface CompatibilityPageCareGuide {
  id: string;
  slug: string | null;
  title: string | null;
  summary: string | null;
  species: {
    id: string;
    slug: string;
    common_name: string;
  };
}

export interface CompatibilityPageLinkInput {
  speciesA: CompatibilityReportSpecies;
  speciesB: CompatibilityReportSpecies;
  careGuides: CompatibilityPageCareGuide[];
  relatedSpecies: CompatibilityReportSpecies[];
}

export interface CompatibilityPageLinks {
  participants: InternalLinkItem[];
  careGuides: InternalLinkItem[];
  relatedCompatibility: InternalLinkItem[];
  topicClusters: InternalLinkItem[];
  builder: InternalLinkItem[];
}

function resolveParticipant(
  species: CompatibilityReportSpecies,
): InternalLinkItem | null {
  const href = resolveInternalLinkPath({
    entityType: "species",
    slug: species.slug,
  });

  return href
    ? {
        entityType: "species",
        entityId: species.entityId,
        title: `${species.name} Species Profile`,
        href,
        description: `Care requirements and species data for ${species.name}.`,
        relationship: "related-content",
      }
    : null;
}

function excludeSeen(
  items: InternalLinkItem[],
  seenPaths: Set<string>,
) {
  return items.filter((item) => {
    if (seenPaths.has(item.href)) {
      return false;
    }

    seenPaths.add(item.href);
    return true;
  });
}

export function buildCompatibilityPageLinks({
  speciesA,
  speciesB,
  careGuides,
  relatedSpecies,
}: CompatibilityPageLinkInput): CompatibilityPageLinks {
  const currentReport: CompatibilityReportCandidate = {
    speciesA,
    speciesB,
  };
  const currentPath = resolveInternalLinkPath({
    entityType: "compatibility-report",
    speciesASlug: speciesA.slug,
    speciesBSlug: speciesB.slug,
  })!;
  const source = {
    entityType: "compatibility-report" as const,
    entityId: `${speciesA.slug}|${speciesB.slug}`,
    href: currentPath,
  };
  const matchedClusters = getMatchingTopicClusters({
    entityType: "compatibility-report",
    speciesSlugs: [speciesA.slug, speciesB.slug],
  });
  const clusterHubs = matchedClusters.flatMap((cluster) => {
    const hub = resolveTopicClusterHub(cluster);
    return hub ? [hub] : [];
  });
  const clusterHubPaths = new Map(
    clusterHubs.map((hub) => [hub.href, hub.description]),
  );
  const participants = [speciesA, speciesB]
    .flatMap((species) => {
      const item = resolveParticipant(species);
      return item ? [item] : [];
    })
    .map((item) =>
      clusterHubPaths.has(item.href)
        ? {
            ...item,
            description:
              clusterHubPaths.get(item.href) ?? item.description,
            relationship: "topic-cluster" as const,
          }
        : item,
    );
  const careGuideCandidates: RelatedContentCandidate[] = careGuides.flatMap(
    (guide) =>
      guide.slug
        ? [
            {
              entityId: guide.id,
              title:
                guide.title ??
                `${guide.species.common_name} Care Guide`,
              description: guide.summary ?? undefined,
              target: {
                entityType: "care-guide" as const,
                slug: guide.slug,
              },
              explicitRelationship: true,
              speciesEntityIds: [guide.species.id],
              speciesSlugs: [guide.species.slug],
              relationship: "care-guide" as const,
            },
          ]
        : [],
  );
  const careGuideLinks = resolveRelatedContent(
    {
      page: source,
      speciesEntityIds: [speciesA.entityId, speciesB.entityId],
      speciesSlugs: [speciesA.slug, speciesB.slug],
    },
    careGuideCandidates,
  );
  const reportCandidates = relatedSpecies.flatMap((related) => [
    { speciesA, speciesB: related },
    { speciesA: speciesB, speciesB: related },
  ]);
  const relatedCompatibility = getRelatedCompatibilityReports(
    currentReport,
    reportCandidates,
  );
  const topicClusterLinks = clusterHubs.filter(
    (hub) => !participants.some((participant) => participant.href === hub.href),
  );
  const builder = resolveRelatedContent(
    { page: source },
    [
      {
        entityId: "aquarium-builder",
        title: "Plan These Species in Aquarium Builder",
        description:
          "Add livestock and validate tank size, stocking, and compatibility.",
        target: { entityType: "builder" },
        explicitRelationship: true,
      },
    ],
    { limit: 1 },
  );
  const seenPaths = new Set<string>();

  return {
    participants: excludeSeen(
      filterInternalLinkItems(participants, { source }),
      seenPaths,
    ),
    careGuides: excludeSeen(careGuideLinks, seenPaths),
    relatedCompatibility: excludeSeen(
      relatedCompatibility,
      seenPaths,
    ),
    topicClusters: excludeSeen(topicClusterLinks, seenPaths),
    builder: excludeSeen(builder, seenPaths),
  };
}

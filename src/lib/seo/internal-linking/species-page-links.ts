import type {
  CompatibilityResult,
  SpeciesCompatibilityGroup,
  SpeciesRow,
} from "../../compatibility/types";
import { filterInternalLinkItems } from "./duplicate-filter";
import { getRelatedSpecies } from "./related-species";
import { resolveRelatedContent } from "./related-content";
import { resolveInternalLinkPath } from "./route-resolver";
import {
  getMatchingTopicClusters,
  resolveTopicClusterHub,
} from "./topic-cluster-service";
import type {
  InternalLinkItem,
  RelatedSpeciesRecommendation,
} from "./types";

export interface SpeciesPageArticle {
  id: string;
  slug: string | null;
  title: string | null;
  summary: string | null;
}

export interface SpeciesPageLinkInput {
  currentSpecies: SpeciesRow;
  candidates: SpeciesRow[];
  compatibility: SpeciesCompatibilityGroup;
  articles?: SpeciesPageArticle[];
}

export interface SpeciesPageLinks {
  similarSpecies: InternalLinkItem[];
  articles: InternalLinkItem[];
  topicClusters: InternalLinkItem[];
  builder: InternalLinkItem[];
  remainingCompatibility: SpeciesCompatibilityGroup;
}

function getRelatedSlug(
  result: CompatibilityResult,
  currentSpeciesSlug: string,
) {
  return result.species_a.slug === currentSpeciesSlug
    ? result.species_b.slug
    : result.species_a.slug;
}

function getCompatibilityBySlug(
  compatibility: SpeciesCompatibilityGroup,
  currentSpeciesSlug: string,
) {
  return new Map(
    [
      ...compatibility.compatible,
      ...compatibility.caution,
      ...compatibility.incompatible,
    ].map((result) => [
      getRelatedSlug(result, currentSpeciesSlug),
      result,
    ]),
  );
}

function toSpeciesLink(
  recommendation: RelatedSpeciesRecommendation,
  relationship: "similar-species" | "similar-care",
): InternalLinkItem | null {
  const href = resolveInternalLinkPath({
    entityType: "species",
    slug: recommendation.species.slug,
  });

  return href
    ? {
        entityType: "species",
        entityId: recommendation.species.id,
        title: recommendation.species.common_name,
        href,
        description: recommendation.reasons.slice(0, 2).join(" "),
        relationship,
        score: recommendation.score,
      }
    : null;
}

function excludeSeen(items: InternalLinkItem[], seen: Set<string>) {
  return items.filter((item) => {
    if (seen.has(item.href)) {
      return false;
    }

    seen.add(item.href);
    return true;
  });
}

export function buildSpeciesPageLinks({
  currentSpecies,
  candidates,
  compatibility,
  articles = [],
}: SpeciesPageLinkInput): SpeciesPageLinks {
  const source = {
    entityType: "species" as const,
    entityId: currentSpecies.id,
    href: `/species/${currentSpecies.slug}`,
  };
  const compatibilityBySlug = getCompatibilityBySlug(
    compatibility,
    currentSpecies.slug,
  );
  const related = getRelatedSpecies(
    currentSpecies,
    candidates.map((species) => {
      const result = compatibilityBySlug.get(species.slug);

      return {
        species,
        compatibility: result?.compatibility ?? undefined,
        compatibilityScore: result?.score,
      };
    }),
    { limit: 4 },
  );
  const similarSpecies = related.similarSpecies.flatMap((recommendation) => {
    const item = toSpeciesLink(recommendation, "similar-species");
    return item ? [item] : [];
  });
  const matchedClusters = getMatchingTopicClusters({
    entityType: "species",
    slug: currentSpecies.slug,
  });
  const articleSlugs = new Set(
    matchedClusters.flatMap(
      (cluster) => cluster.articles?.map((article) => article.slug) ?? [],
    ),
  );
  const articleLinks = resolveRelatedContent(
    {
      page: source,
      speciesEntityIds: [currentSpecies.id],
      speciesSlugs: [currentSpecies.slug],
    },
    articles.flatMap((article) =>
      article.slug && articleSlugs.has(article.slug)
        ? [
            {
              entityId: article.id,
              title: article.title ?? "Aquarium Article",
              description: article.summary ?? undefined,
              target: {
                entityType: "article" as const,
                slug: article.slug,
              },
              explicitRelationship: true,
            },
          ]
        : [],
    ),
    { limit: 4 },
  );
  const topicClusterLinks = matchedClusters.flatMap((cluster) => {
    const hub = resolveTopicClusterHub(cluster);
    return hub ? [hub] : [];
  });
  const builder = resolveRelatedContent(
    { page: source },
    [
      {
        entityId: "aquarium-builder",
        title: `Add ${currentSpecies.common_name} to Aquarium Builder`,
        description:
          "Check tank size, stocking, and compatibility in a complete aquarium plan.",
        target: { entityType: "builder" },
        explicitRelationship: true,
      },
    ],
    { limit: 1 },
  );
  const seen = new Set<string>();
  const filteredSimilarSpecies = excludeSeen(
    filterInternalLinkItems(similarSpecies, { source, limit: 4 }),
    seen,
  );
  const filteredArticles = excludeSeen(articleLinks, seen);
  const filteredTopicClusters = excludeSeen(
    filterInternalLinkItems(topicClusterLinks, { source }),
    seen,
  );
  const filteredBuilder = excludeSeen(builder, seen);
  return {
    similarSpecies: filteredSimilarSpecies,
    articles: filteredArticles,
    topicClusters: filteredTopicClusters,
    builder: filteredBuilder,
    remainingCompatibility: compatibility,
  };
}

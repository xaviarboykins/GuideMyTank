import { filterInternalLinkItems } from "./duplicate-filter";
import { resolveInternalLinkPath } from "./route-resolver";
import {
  getMatchingTopicClusters,
  resolveTopicClusterHub,
} from "./topic-cluster-service";
import type { InternalLinkItem } from "./types";
import {
  isProductCategory,
  productCategoryLabels,
} from "../../products/types";

interface ArticleCareGuide {
  care_guide_id: string;
  care_guide: {
    id: string;
    slug: string | null;
    title: string | null;
    summary: string | null;
    status: string;
    species: {
      id: string;
      slug: string;
      common_name: string;
      scientific_name: string;
    };
  } | null;
}

interface RelatedArticle {
  related_article_id: string;
  related_article: {
    slug: string | null;
    title: string | null;
    summary: string | null;
    status: string;
  } | null;
}

interface ArticleClusterSpecies {
  id: string;
  slug: string;
  common_name: string;
  scientific_name: string;
}

export interface ArticlePageLinkInput {
  article: {
    id: string;
    slug: string;
    includeProducts?: boolean;
    productCategory?: string | null;
  };
  relatedCareGuides?: ArticleCareGuide[];
  relatedArticles?: RelatedArticle[];
  clusterSpecies?: ArticleClusterSpecies[];
}

export interface ArticlePageLinks {
  species: InternalLinkItem[];
  clusterSpecies: InternalLinkItem[];
  careGuides: InternalLinkItem[];
  compatibilityReports: InternalLinkItem[];
  relatedArticles: InternalLinkItem[];
  topicClusters: InternalLinkItem[];
  builder: InternalLinkItem[];
  productCategories: InternalLinkItem[];
}

function excludeSeen(items: InternalLinkItem[], seen: Set<string>) {
  return items.filter((item) => {
    if (seen.has(item.href)) return false;
    seen.add(item.href);
    return true;
  });
}

export function buildArticlePageLinks({
  article,
  relatedCareGuides = [],
  relatedArticles = [],
  clusterSpecies = [],
}: ArticlePageLinkInput): ArticlePageLinks {
  const source = {
    entityType: "article" as const,
    entityId: article.id,
    href: `/learning-center/${article.slug}`,
  };
  const publishedGuides = relatedCareGuides.flatMap((item) =>
    item.care_guide?.status === "published" &&
    item.care_guide.slug
      ? [item.care_guide]
      : [],
  );
  const clusterHubs = getMatchingTopicClusters({
    entityType: "article",
    slug: article.slug,
  }).flatMap((cluster) => {
    const hub = resolveTopicClusterHub(cluster);
    return hub ? [hub] : [];
  });
  const species = publishedGuides.flatMap((guide) => {
    const href = resolveInternalLinkPath({
      entityType: "species",
      slug: guide.species.slug,
    });
    return href
      ? [
          {
            entityType: "species" as const,
            entityId: guide.species.id,
            title: `${guide.species.common_name} Species Profile`,
            href,
            description: guide.species.scientific_name,
            relationship: "related-content" as const,
          },
        ]
      : [];
  });
  const clusterSpeciesLinks = clusterSpecies.flatMap((item, index) => {
    const href = resolveInternalLinkPath({
      entityType: "species",
      slug: item.slug,
    });
    return href
      ? [
          {
            entityType: "species" as const,
            entityId: item.id,
            title: `${item.common_name} Species Profile`,
            href,
            description: item.scientific_name,
            relationship: "topic-cluster" as const,
            score: clusterSpecies.length - index,
          },
        ]
      : [];
  });
  const hubDescriptions = new Map(
    clusterHubs.map((hub) => [hub.href, hub.description]),
  );
  const speciesWithClusterContext = species.map((item) =>
    hubDescriptions.has(item.href)
      ? {
          ...item,
          description: hubDescriptions.get(item.href) ?? item.description,
          relationship: "topic-cluster" as const,
        }
      : item,
  );
  const careGuides = publishedGuides.flatMap((guide) => {
    const href = resolveInternalLinkPath({
      entityType: "care-guide",
      slug: guide.slug!,
    });
    return href
      ? [
          {
            entityType: "care-guide" as const,
            entityId: guide.id,
            title:
              guide.title ??
              `${guide.species.common_name} Care Guide`,
            href,
            description: guide.summary ?? undefined,
            relationship: "care-guide" as const,
          },
        ]
      : [];
  });
  const compatibilityReports = publishedGuides.flatMap(
    (guide, index) =>
      publishedGuides.slice(index + 1).flatMap((otherGuide) => {
        const href = resolveInternalLinkPath({
          entityType: "compatibility-report",
          speciesASlug: guide.species.slug,
          speciesBSlug: otherGuide.species.slug,
        });
        return href
          ? [
              {
                entityType: "compatibility-report" as const,
                entityId: `${guide.species.id}:${otherGuide.species.id}`,
                title: `${guide.species.common_name} and ${otherGuide.species.common_name} Compatibility`,
                href,
                description: `Research whether ${guide.species.common_name} and ${otherGuide.species.common_name} can share an aquarium.`,
                relationship: "related-compatibility" as const,
              },
            ]
          : [];
      }),
  );
  const articleLinks = relatedArticles.flatMap((item) => {
    if (
      item.related_article?.status !== "published" ||
      !item.related_article.slug
    ) {
      return [];
    }
    const href = resolveInternalLinkPath({
      entityType: "article",
      slug: item.related_article.slug,
    });
    return href
      ? [
          {
            entityType: "article" as const,
            entityId: item.related_article_id,
            title: item.related_article.title ?? "Aquarium Article",
            href,
            description: item.related_article.summary ?? undefined,
            relationship: "related-content" as const,
          },
        ]
      : [];
  });
  const builder =
    publishedGuides.length > 0
      ? [
          {
            entityType: "builder" as const,
            entityId: "aquarium-builder",
            title: "Plan these species in Aquarium Builder",
            href: resolveInternalLinkPath({ entityType: "builder" })!,
            description:
              "Use the species from this article in a complete stocking plan.",
            relationship: "builder-action" as const,
          },
        ]
      : [];
  const productCategories =
    article.includeProducts &&
    article.productCategory &&
    isProductCategory(article.productCategory)
      ? [
          {
            entityType: "product-category" as const,
            entityId: article.productCategory,
            title: `Browse ${productCategoryLabels[article.productCategory]}`,
            href: resolveInternalLinkPath({
              entityType: "product-category",
              category: article.productCategory,
            })!,
            description:
              "Compare relevant aquarium equipment in this product category.",
            relationship: "product-category" as const,
          },
        ]
      : [];
  const topicClusters = clusterHubs.filter(
    (hub) =>
      !speciesWithClusterContext.some(
        (item) => item.href === hub.href,
      ),
  );
  const seen = new Set<string>();
  const filter = (items: InternalLinkItem[], limit?: number) =>
    excludeSeen(
      filterInternalLinkItems(items, { source, limit }),
      seen,
    );

  return {
    clusterSpecies: filter(clusterSpeciesLinks, 10),
    species: filter(speciesWithClusterContext, 4),
    careGuides: filter(careGuides, 4),
    compatibilityReports: filter(compatibilityReports, 4),
    relatedArticles: filter(articleLinks, 4),
    topicClusters: filter(topicClusters, 1),
    builder: filter(builder, 1),
    productCategories: filter(productCategories, 1),
  };
}

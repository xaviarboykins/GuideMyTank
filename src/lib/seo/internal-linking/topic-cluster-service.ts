import {
  isProductCategory,
  productCategoryLabels,
} from "../../products/types";
import { filterInternalLinkItems } from "./duplicate-filter";
import { resolveInternalLinkPath } from "./route-resolver";
import { topicClusters } from "./topic-clusters";
import type {
  InternalLinkItem,
  InternalLinkPageIdentity,
  TopicClusterAvailability,
  TopicClusterDefinition,
  TopicClusterPageContext,
} from "./types";

function includesMember(
  members: readonly { slug: string }[] | undefined,
  slug: string | undefined,
) {
  return Boolean(
    slug && members?.some((member) => member.slug === slug),
  );
}

export function getMatchingTopicClusters(
  context: TopicClusterPageContext,
): TopicClusterDefinition[] {
  return topicClusters.filter((configuredCluster) => {
    const cluster: TopicClusterDefinition = configuredCluster;

    if (context.entityType === "species") {
      return includesMember(cluster.species, context.slug);
    }

    if (context.entityType === "care-guide") {
      return includesMember(cluster.careGuides, context.slug);
    }

    if (context.entityType === "article") {
      return includesMember(cluster.articles, context.slug);
    }

    if (context.entityType === "guide") {
      return includesMember(cluster.guides, context.slug);
    }

    if (context.entityType === "compatibility-report") {
      return context.speciesSlugs?.some((slug) =>
        cluster.compatibilitySpeciesSlugs?.includes(slug),
      );
    }

    if (context.entityType === "product-category") {
      return Boolean(
        context.categorySlug &&
          isProductCategory(context.categorySlug) &&
          cluster.productCategories?.includes(context.categorySlug),
      );
    }

    return false;
  });
}

export function resolveTopicClusterHub(
  cluster: TopicClusterDefinition,
): InternalLinkItem | null {
  const href = resolveInternalLinkPath(cluster.hub);

  if (!href) {
    return null;
  }

  return {
    entityType: "topic-cluster",
    entityId: cluster.slug,
    title: cluster.title,
    href,
    description: cluster.description,
    relationship: "topic-cluster",
  };
}

export function resolveTopicClusterMembers(
  cluster: TopicClusterDefinition,
  availability: TopicClusterAvailability,
  source?: InternalLinkPageIdentity,
): InternalLinkItem[] {
  const items: InternalLinkItem[] = [];

  for (const member of cluster.species ?? []) {
    const href = resolveInternalLinkPath({
      entityType: "species",
      slug: member.slug,
    });

    if (href && availability.speciesSlugs.has(member.slug)) {
      items.push({
        entityType: "species",
        entityId: member.slug,
        title: member.title,
        href,
        description: member.description,
        relationship: "topic-cluster",
      });
    }
  }

  for (const member of cluster.careGuides ?? []) {
    const href = resolveInternalLinkPath({
      entityType: "care-guide",
      slug: member.slug,
    });

    if (href && availability.careGuideSlugs.has(member.slug)) {
      items.push({
        entityType: "care-guide",
        entityId: member.slug,
        title: member.title,
        href,
        description: member.description,
        relationship: "topic-cluster",
      });
    }
  }

  for (const member of cluster.articles ?? []) {
    const href = resolveInternalLinkPath({
      entityType: "article",
      slug: member.slug,
    });

    if (href && availability.articleSlugs.has(member.slug)) {
      items.push({
        entityType: "article",
        entityId: member.slug,
        title: member.title,
        href,
        description: member.description,
        relationship: "topic-cluster",
      });
    }
  }

  for (const member of cluster.guides ?? []) {
    const href = resolveInternalLinkPath({
      entityType: "guide",
      slug: member.slug,
    });

    if (href && availability.guideSlugs.has(member.slug)) {
      items.push({
        entityType: "guide",
        entityId: member.slug,
        title: member.title,
        href,
        description: member.description,
        relationship: "topic-cluster",
      });
    }
  }

  for (const category of cluster.productCategories ?? []) {
    const href = resolveInternalLinkPath({
      entityType: "product-category",
      category,
    });

    if (href && availability.productCategories.has(category)) {
      items.push({
        entityType: "product-category",
        entityId: category,
        title: productCategoryLabels[category],
        href,
        relationship: "product-category",
      });
    }
  }

  return filterInternalLinkItems(items, { source });
}

import { RELATED_CONTENT_WEIGHTS } from "./constants";
import { filterInternalLinkItems } from "./duplicate-filter";
import { resolveInternalLinkPath } from "./route-resolver";
import type {
  InternalLinkItem,
  RelatedContentCandidate,
  RelatedContentContext,
  RelatedContentOptions,
} from "./types";

function countShared(valuesA: string[] = [], valuesB: string[] = []) {
  const valuesBSet = new Set(valuesB);

  return new Set(valuesA.filter((value) => valuesBSet.has(value))).size;
}

function getRelationshipScore(
  context: RelatedContentContext,
  candidate: RelatedContentCandidate,
) {
  const sharedSpecies = Math.max(
    countShared(context.speciesEntityIds, candidate.speciesEntityIds),
    countShared(context.speciesSlugs, candidate.speciesSlugs),
  );
  const sharedCategories = countShared(
    context.categorySlugs,
    candidate.categorySlugs,
  );
  const sharedTags = countShared(context.tagSlugs, candidate.tagSlugs);

  return (
    (candidate.explicitRelationship
      ? RELATED_CONTENT_WEIGHTS.explicitRelationship
      : 0) +
    sharedSpecies * RELATED_CONTENT_WEIGHTS.sharedSpecies +
    sharedCategories * RELATED_CONTENT_WEIGHTS.sharedCategory +
    sharedTags * RELATED_CONTENT_WEIGHTS.sharedTag
  );
}

export function resolveRelatedContent(
  context: RelatedContentContext,
  candidates: RelatedContentCandidate[],
  options: RelatedContentOptions = {},
): InternalLinkItem[] {
  const items = candidates.flatMap((candidate) => {
    if (
      candidate.availability === "draft" ||
      candidate.availability === "archived"
    ) {
      return [];
    }

    const href = resolveInternalLinkPath(candidate.target);
    const score = getRelationshipScore(context, candidate);

    if (!href || score <= 0) {
      return [];
    }

    return [
      {
        entityType: candidate.target.entityType,
        entityId: candidate.entityId,
        title: candidate.title,
        href,
        description: candidate.description,
        relationship:
          candidate.relationship ??
          (candidate.target.entityType === "builder"
            ? "builder-action"
            : candidate.target.entityType === "product-category"
              ? "product-category"
              : "related-content"),
        score,
      } satisfies InternalLinkItem,
    ];
  });

  return filterInternalLinkItems(items, {
    source: context.page,
    limit: options.limit,
  });
}

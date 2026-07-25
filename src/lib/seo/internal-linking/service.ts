import "server-only";

import { getPublishedCareGuidesForSpeciesSlugs } from "../../care-guides/service";
import { getSpeciesBySlugs, getSpeciesLinkCandidates } from "../../data/species";
import { getPublishedArticlesBySlugs } from "../../articles/service";
import {
  buildCompatibilityPageLinks,
  type CompatibilityPageLinks,
} from "./compatibility-page-links";
import type { CompatibilityResult } from "../../compatibility/types";
import type {
  SpeciesCompatibilityGroup,
  SpeciesRow,
} from "../../compatibility/types";
import { getMatchingTopicClusters } from "./topic-cluster-service";
import {
  buildSpeciesPageLinks,
  type SpeciesPageLinks,
} from "./species-page-links";
import {
  buildCareGuidePageLinks,
  type CareGuidePageLinks,
} from "./care-guide-page-links";
import {
  buildArticlePageLinks,
  type ArticlePageLinks,
} from "./article-page-links";

type PublishedCareGuide = NonNullable<
  Awaited<ReturnType<typeof import("../../care-guides/service").getPublishedCareGuideBySlug>>
>;
type PublishedArticle = NonNullable<
  Awaited<ReturnType<typeof import("../../articles/service").getPublishedArticleBySlug>>
>;

export async function getCompatibilityPageLinks(
  compatibility: CompatibilityResult,
): Promise<CompatibilityPageLinks> {
  const speciesSlugs = [
    compatibility.species_a.slug,
    compatibility.species_b.slug,
  ];
  const [careGuides, relatedSpecies] = await Promise.all([
    getPublishedCareGuidesForSpeciesSlugs(speciesSlugs),
    getSpeciesLinkCandidates(speciesSlugs, 12),
  ]);

  return buildCompatibilityPageLinks({
    speciesA: {
      entityId: compatibility.species_a.slug,
      slug: compatibility.species_a.slug,
      name: compatibility.species_a.common_name,
    },
    speciesB: {
      entityId: compatibility.species_b.slug,
      slug: compatibility.species_b.slug,
      name: compatibility.species_b.common_name,
    },
    careGuides,
    relatedSpecies: relatedSpecies.map((species) => ({
      entityId: species.id,
      slug: species.slug,
      name: species.common_name,
    })),
  });
}

export async function getSpeciesPageLinks(
  currentSpecies: SpeciesRow,
  candidates: SpeciesRow[],
  compatibility: SpeciesCompatibilityGroup,
): Promise<SpeciesPageLinks> {
  const clusters = getMatchingTopicClusters({
    entityType: "species",
    slug: currentSpecies.slug,
  });
  const articleSlugs = [
    ...new Set(
      clusters.flatMap(
        (cluster) =>
          cluster.articles?.map((article) => article.slug) ?? [],
      ),
    ),
  ];
  const articles = await getPublishedArticlesBySlugs(articleSlugs);

  return buildSpeciesPageLinks({
    currentSpecies,
    candidates,
    compatibility,
    articles,
  });
}

export async function getCareGuidePageLinks(
  content: PublishedCareGuide,
): Promise<CareGuidePageLinks> {
  const relatedSpeciesSlugs = content.relatedSpecies.map(
    (item) => item.species.slug,
  );
  const relatedCareGuides =
    await getPublishedCareGuidesForSpeciesSlugs(relatedSpeciesSlugs);

  return buildCareGuidePageLinks({
    guide: {
      id: content.guide.id,
      slug: content.guide.slug ?? content.guide.species.slug,
    },
    species: {
      id: content.guide.species.id,
      slug: content.guide.species.slug,
      commonName: content.guide.species.common_name,
      scientificName: content.guide.species.scientific_name,
    },
    relatedSpecies: content.relatedSpecies.map((item) => ({
      id: item.species.id,
      slug: item.species.slug,
      commonName: item.species.common_name,
      scientificName: item.species.scientific_name,
    })),
    relatedCareGuides,
    relatedArticles: content.relatedArticles,
  });
}

export async function getArticlePageLinks(
  content: PublishedArticle,
): Promise<ArticlePageLinks> {
  const clusterSpeciesSlugs = [
    ...new Set(
      getMatchingTopicClusters({
        entityType: "article",
        slug: content.article.slug ?? undefined,
      }).flatMap(
        (cluster) =>
          cluster.species?.map((species) => species.slug) ?? [],
      ),
    ),
  ];
  const availableClusterSpecies =
    await getSpeciesBySlugs(clusterSpeciesSlugs);
  const clusterSpeciesBySlug = new Map(
    availableClusterSpecies.map((species) => [species.slug, species]),
  );
  const clusterSpecies = clusterSpeciesSlugs.flatMap((slug) => {
    const species = clusterSpeciesBySlug.get(slug);
    return species ? [species] : [];
  });

  return buildArticlePageLinks({
    article: {
      id: content.article.id,
      slug: content.article.slug!,
      includeProducts: content.article.include_products,
      productCategory: content.article.product_category,
    },
    relatedCareGuides: content.relatedCareGuides,
    relatedArticles: content.relatedArticles,
    clusterSpecies,
  });
}

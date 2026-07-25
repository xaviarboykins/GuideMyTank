import { describe, expect, it } from "vitest";

import { buildArticlePageLinks } from "./article-page-links";

function guide(
  id: string,
  slug: string,
  status = "published",
) {
  return {
    care_guide_id: `guide-${id}`,
    care_guide: {
      id: `guide-${id}`,
      slug,
      title: `${id} Care Guide`,
      summary: `${id} care.`,
      status,
      species: {
        id,
        slug,
        common_name: id,
        scientific_name: `${id} scientific`,
      },
    },
  };
}

describe("Article page internal links", () => {
  it("resolves curated Species, Care Guides, reports, and Builder links", () => {
    const links = buildArticlePageLinks({
      article: { id: "article-id", slug: "community-fish" },
      relatedCareGuides: [
        guide("betta", "betta-splendens"),
        guide("neon", "neon-tetra"),
      ],
    });

    expect(links.species.map((item) => item.href)).toEqual([
      "/species/betta-splendens",
      "/species/neon-tetra",
    ]);
    expect(links.careGuides).toHaveLength(2);
    expect(links.compatibilityReports[0]?.href).toBe(
      "/compatibility/betta-splendens/neon-tetra",
    );
    expect(links.builder[0]?.href).toBe("/aquarium-builder");
  });

  it("excludes drafts, self-links, and duplicate targets", () => {
    const links = buildArticlePageLinks({
      article: { id: "article-id", slug: "current-article" },
      relatedCareGuides: [
        guide("draft", "draft-fish", "draft"),
      ],
      relatedArticles: [
        {
          related_article_id: "article-id",
          related_article: {
            slug: "current-article",
            title: "Current",
            summary: null,
            status: "published",
          },
        },
        {
          related_article_id: "draft-article",
          related_article: {
            slug: "draft-article",
            title: "Draft",
            summary: null,
            status: "draft",
          },
        },
      ],
    });

    expect(links.species).toEqual([]);
    expect(links.careGuides).toEqual([]);
    expect(links.relatedArticles).toEqual([]);
    expect(links.builder).toEqual([]);
  });

  it("does not infer a Topic Cluster from a Species relationship", () => {
    const links = buildArticlePageLinks({
      article: {
        id: "popular-id",
        slug: "most-popular-freshwater-aquarium-fish-2026",
      },
      relatedCareGuides: [
        guide("betta", "betta-splendens"),
      ],
    });

    expect(links.species[0]?.relationship).toBe("related-content");
    expect(links.topicClusters).toEqual([]);
  });

  it("only includes the editor-selected product category when enabled", () => {
    const hidden = buildArticlePageLinks({
      article: {
        id: "filters-id",
        slug: "filter-guide",
        includeProducts: false,
        productCategory: "filters",
      },
    });
    const visible = buildArticlePageLinks({
      article: {
        id: "filters-id",
        slug: "filter-guide",
        includeProducts: true,
        productCategory: "filters",
      },
    });

    expect(hidden.productCategories).toEqual([]);
    expect(visible.productCategories[0]?.href).toBe(
      "/aquarium-builder/products/filters",
    );
  });

  it("returns up to ten available cluster Species without duplicates", () => {
    const clusterSpecies = Array.from({ length: 10 }, (_, index) => ({
      id: `fish-${index}`,
      slug: `fish-${index}`,
      common_name: `Fish ${index}`,
      scientific_name: `Scientific ${index}`,
    }));
    const links = buildArticlePageLinks({
      article: {
        id: "popular-id",
        slug: "most-popular-freshwater-aquarium-fish-2026",
      },
      clusterSpecies: [...clusterSpecies, clusterSpecies[0]],
    });

    expect(links.clusterSpecies).toHaveLength(10);
    expect(new Set(links.clusterSpecies.map((item) => item.href)).size).toBe(
      10,
    );
    expect(links.topicClusters).toEqual([]);
  });
});

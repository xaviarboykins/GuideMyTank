import { describe, expect, it } from "vitest";

import {
  auditInternalLinkPages,
  generateInternalLinkAudit,
} from "./audit";

describe("internal link audit", () => {
  it("builds a connected canonical Species and Compatibility graph", () => {
    const report = generateInternalLinkAudit({
      species: [
        { id: "a", slug: "alpha-fish" },
        { id: "b", slug: "beta-fish" },
      ],
      careGuides: [],
      articles: [],
      careGuideRelatedSpecies: [],
      articleRelatedCareGuides: [],
      articleRelatedArticles: [],
    });

    expect(report.summary.pages).toBe(3);
    expect(report.issues).toEqual([]);
  });

  it("detects invalid, duplicate, self, noncanonical, and orphan links", () => {
    const report = auditInternalLinkPages([
      {
        path: "/species/alpha",
        entityType: "species",
        entityId: "alpha",
        indexable: true,
        links: [
          "/species/alpha",
          "/missing",
          "/missing",
          "/compatibility/zeta/alpha",
        ],
      },
      {
        path: "/learning-center/orphan",
        entityType: "article",
        entityId: "orphan",
        indexable: true,
        links: [],
      },
    ]);

    expect(report.issues.map((item) => item.category)).toEqual(
      expect.arrayContaining([
        "self_link",
        "invalid_internal_target",
        "duplicate_target",
        "noncanonical_compatibility_url",
        "orphan_page",
      ]),
    );
  });

  it("reports links to unpublished content", () => {
    const report = auditInternalLinkPages([
      {
        path: "/learning-center/published",
        entityType: "article",
        entityId: "published",
        indexable: true,
        links: ["/learning-center/draft"],
      },
      {
        path: "/learning-center/draft",
        entityType: "article",
        entityId: "draft",
        indexable: false,
        links: [],
      },
    ]);

    expect(report.issues[0]?.category).toBe("draft_or_archived_target");
  });

  it("connects a configured Article hub and Species members", () => {
    const report = generateInternalLinkAudit({
      species: [{ id: "betta", slug: "betta-splendens" }],
      careGuides: [],
      articles: [
        {
          id: "article",
          slug: "popular-fish",
          status: "published",
        },
      ],
      careGuideRelatedSpecies: [],
      articleRelatedCareGuides: [],
      articleRelatedArticles: [],
      topicClusters: [
        {
          hub: { entityType: "article", slug: "popular-fish" },
          species: [{ slug: "betta-splendens" }],
          articles: [{ slug: "popular-fish" }],
        },
      ],
    });

    expect(
      report.issues.filter((item) => item.category === "orphan_page"),
    ).toEqual([]);
  });

  it("models published Guides at their canonical route with generated links", () => {
    const report = generateInternalLinkAudit({
      species: [
        { id: "betta", slug: "betta-splendens" },
        { id: "guppy", slug: "guppy" },
      ],
      careGuides: [],
      articles: [
        {
          id: "comparison",
          slug: "betta-vs-guppy",
          status: "published",
          content_type: "guide",
          generated_links: [
            "/species/betta-splendens",
            "/species/guppy",
            "/compatibility/betta-splendens/guppy",
            "/aquarium-builder",
          ],
        },
      ],
      careGuideRelatedSpecies: [],
      articleRelatedCareGuides: [],
      articleRelatedArticles: [],
      topicClusters: [
        {
          hub: { entityType: "species", slug: "betta-splendens" },
          species: [{ slug: "betta-splendens" }],
          guides: [{ slug: "betta-vs-guppy" }],
        },
      ],
    });

    expect(
      report.issues.filter(
        (item) => item.source === "/learning-center/guides/betta-vs-guppy",
      ),
    ).toEqual([]);
    expect(report.summary.pages).toBe(4);
  });

  it("models the de-duplicated links produced by public content renderers", () => {
    const report = generateInternalLinkAudit({
      species: [{ id: "betta", slug: "betta-splendens" }],
      careGuides: [
        {
          id: "care-guide",
          slug: "betta-splendens",
          status: "published",
          species_id: "betta",
        },
      ],
      articles: [
        {
          id: "guide",
          slug: "betta-guide",
          status: "published",
          content_type: "guide",
          generated_links: [
            "/care-guides/betta-splendens",
            "/species/betta-splendens",
            "/aquarium-builder",
          ],
        },
      ],
      careGuideRelatedSpecies: [],
      articleRelatedCareGuides: [
        { article_id: "guide", care_guide_id: "care-guide" },
      ],
      articleRelatedArticles: [],
    });

    expect(
      report.issues.filter((item) => item.category === "duplicate_target"),
    ).toEqual([]);
  });

  it("automatically connects published Learning Center content", () => {
    const report = generateInternalLinkAudit({
      species: [],
      careGuides: [],
      articles: [
        { id: "article", slug: "article", status: "published", content_type: "article", published_at: "2026-09-02" },
        { id: "guide", slug: "guide", status: "published", content_type: "guide", published_at: "2026-09-01" },
      ],
      careGuideRelatedSpecies: [],
      articleRelatedCareGuides: [],
      articleRelatedArticles: [],
    });

    expect(report.issues.filter((item) => item.category === "orphan_page")).toEqual([]);
  });
});

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
});

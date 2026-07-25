import { describe, expect, it } from "vitest";

import { resolveRelatedContent } from "./related-content";
import type {
  InternalLinkPageIdentity,
  RelatedContentCandidate,
} from "./types";

const source: InternalLinkPageIdentity = {
  entityType: "species",
  entityId: "betta-id",
  href: "/species/betta-splendens",
};

function candidate(
  overrides: Partial<RelatedContentCandidate> = {},
): RelatedContentCandidate {
  return {
    entityId: "article-1",
    title: "Betta Article",
    target: { entityType: "article", slug: "betta-article" },
    ...overrides,
  };
}

describe("related content resolution", () => {
  it("ranks explicit editorial relationships above inferred matches", () => {
    const links = resolveRelatedContent(
      {
        page: source,
        speciesEntityIds: ["betta-id"],
        categorySlugs: ["fish-care"],
        tagSlugs: ["betta"],
      },
      [
        candidate({
          entityId: "inferred",
          title: "Inferred",
          speciesEntityIds: ["betta-id"],
        }),
        candidate({
          entityId: "explicit",
          title: "Explicit",
          target: { entityType: "article", slug: "explicit" },
          explicitRelationship: true,
        }),
      ],
    );

    expect(links.map((link) => link.entityId)).toEqual([
      "explicit",
      "inferred",
    ]);
  });

  it("combines shared species, category, and tag signals", () => {
    const [link] = resolveRelatedContent(
      {
        page: source,
        speciesSlugs: ["betta-splendens"],
        categorySlugs: ["fish-care"],
        tagSlugs: ["betta"],
      },
      [
        candidate({
          speciesSlugs: ["betta-splendens"],
          categorySlugs: ["fish-care"],
          tagSlugs: ["betta"],
        }),
      ],
    );

    expect(link.score).toBe(75);
  });

  it("excludes unavailable, unrelated, invalid, and self targets", () => {
    const links = resolveRelatedContent(
      { page: source, speciesSlugs: ["betta-splendens"] },
      [
        candidate({ availability: "draft", explicitRelationship: true }),
        candidate({
          entityId: "archived",
          availability: "archived",
          explicitRelationship: true,
        }),
        candidate({ entityId: "unrelated" }),
        candidate({
          entityId: "invalid",
          target: { entityType: "article", slug: "Invalid Slug" },
          explicitRelationship: true,
        }),
        candidate({
          entityId: "self",
          target: { entityType: "species", slug: "betta-splendens" },
          explicitRelationship: true,
        }),
      ],
    );

    expect(links).toEqual([]);
  });

  it("assigns action relationships and enforces limits", () => {
    const links = resolveRelatedContent(
      { page: source },
      [
        candidate({
          entityId: "builder",
          title: "Add to Builder",
          target: { entityType: "builder" },
          explicitRelationship: true,
        }),
        candidate({
          entityId: "heaters",
          title: "Aquarium Heaters",
          target: {
            entityType: "product-category",
            category: "heaters",
          },
          explicitRelationship: true,
        }),
      ],
      { limit: 1 },
    );

    expect(links).toHaveLength(1);
    expect(links[0].relationship).toBe("builder-action");
  });
});

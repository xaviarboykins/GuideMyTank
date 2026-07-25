import { describe, expect, it } from "vitest";

import { MAX_INTERNAL_LINK_LIMIT } from "./constants";
import { filterInternalLinkItems } from "./duplicate-filter";
import type { InternalLinkItem } from "./types";

function createItem(
  href: string,
  title: string,
  score?: number,
): InternalLinkItem {
  return {
    entityType: "species",
    entityId: title.toLowerCase(),
    title,
    href,
    relationship: "similar-species",
    score,
  };
}

describe("internal-link duplicate and self-link filtering", () => {
  it("removes a canonical self-link", () => {
    expect(
      filterInternalLinkItems(
        [
          createItem("/species/betta-splendens/", "Betta"),
          createItem("/species/neon-tetra", "Neon Tetra"),
        ],
        {
          source: {
            entityType: "species",
            entityId: "betta",
            href: "/species/betta-splendens?source=test",
          },
        },
      ),
    ).toEqual([createItem("/species/neon-tetra", "Neon Tetra")]);
  });

  it("deduplicates canonical paths and keeps the highest score", () => {
    const result = filterInternalLinkItems([
      createItem("/species/neon-tetra/", "Neon Tetra", 10),
      createItem("/species/neon-tetra?duplicate=true", "Neon Tetra", 25),
    ]);

    expect(result).toEqual([
      createItem("/species/neon-tetra", "Neon Tetra", 25),
    ]);
  });

  it("sorts results consistently by score and title", () => {
    const result = filterInternalLinkItems([
      createItem("/species/zebra-danio", "Zebra Danio", 20),
      createItem("/species/ember-tetra", "Ember Tetra", 30),
      createItem("/species/cardinal-tetra", "Cardinal Tetra", 20),
    ]);

    expect(result.map((item) => item.title)).toEqual([
      "Ember Tetra",
      "Cardinal Tetra",
      "Zebra Danio",
    ]);
  });

  it("enforces requested and absolute maximum limits", () => {
    const items = Array.from({ length: MAX_INTERNAL_LINK_LIMIT + 5 }, (_, index) =>
      createItem(`/species/species-${index}`, `Species ${index}`),
    );

    expect(filterInternalLinkItems(items, { limit: 2 })).toHaveLength(2);
    expect(filterInternalLinkItems(items, { limit: 999 })).toHaveLength(
      MAX_INTERNAL_LINK_LIMIT,
    );
    expect(filterInternalLinkItems(items, { limit: 0 })).toEqual([]);
  });

  it("excludes invalid targets", () => {
    expect(
      filterInternalLinkItems([
        createItem("https://example.com/species/betta", "External"),
        createItem("/species/betta-splendens", "Betta"),
      ]),
    ).toEqual([
      createItem("/species/betta-splendens", "Betta"),
    ]);
  });
});

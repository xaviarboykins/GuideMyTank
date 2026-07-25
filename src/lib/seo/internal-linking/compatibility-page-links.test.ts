import { describe, expect, it } from "vitest";

import { buildCompatibilityPageLinks } from "./compatibility-page-links";

const betta = {
  entityId: "betta-id",
  slug: "betta-splendens",
  name: "Betta",
};
const neon = {
  entityId: "neon-id",
  slug: "neon-tetra",
  name: "Neon Tetra",
};

describe("compatibility page internal links", () => {
  it("links both participants and available Care Guides", () => {
    const links = buildCompatibilityPageLinks({
      speciesA: betta,
      speciesB: neon,
      careGuides: [
        {
          id: "guide-id",
          slug: "betta-splendens",
          title: "Betta Fish Care Guide",
          summary: "Complete Betta care.",
          species: {
            id: "betta-id",
            slug: "betta-splendens",
            common_name: "Betta",
          },
        },
      ],
      relatedSpecies: [],
    });

    expect(links.participants.map((item) => item.href)).toEqual([
      "/species/betta-splendens",
      "/species/neon-tetra",
    ]);
    expect(links.careGuides.map((item) => item.href)).toEqual([
      "/care-guides/betta-splendens",
    ]);
  });

  it("merges a duplicate topic hub into the participant link", () => {
    const links = buildCompatibilityPageLinks({
      speciesA: betta,
      speciesB: neon,
      careGuides: [],
      relatedSpecies: [],
    });

    expect(
      links.participants.find(
        (item) => item.href === "/species/betta-splendens",
      )?.relationship,
    ).toBe("topic-cluster");
    expect(links.topicClusters).toEqual([]);
  });

  it("returns canonical related reports and the builder action", () => {
    const links = buildCompatibilityPageLinks({
      speciesA: betta,
      speciesB: neon,
      careGuides: [],
      relatedSpecies: [
        {
          entityId: "ember-id",
          slug: "ember-tetra",
          name: "Ember Tetra",
        },
      ],
    });

    expect(links.relatedCompatibility.map((item) => item.href)).toEqual([
      "/compatibility/betta-splendens/ember-tetra",
      "/compatibility/ember-tetra/neon-tetra",
    ]);
    expect(links.builder[0].href).toBe("/aquarium-builder");
  });

  it("does not emit duplicate targets across page sections", () => {
    const links = buildCompatibilityPageLinks({
      speciesA: betta,
      speciesB: neon,
      careGuides: [],
      relatedSpecies: [
        {
          entityId: "ember-id",
          slug: "ember-tetra",
          name: "Ember Tetra",
        },
      ],
    });
    const hrefs = Object.values(links)
      .flat()
      .map((item) => item.href);

    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});

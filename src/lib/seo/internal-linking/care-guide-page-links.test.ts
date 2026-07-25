import { describe, expect, it } from "vitest";

import { buildCareGuidePageLinks } from "./care-guide-page-links";

const betta = {
  id: "betta-id",
  slug: "betta-splendens",
  commonName: "Betta",
  scientificName: "Betta splendens",
};

describe("Care Guide page internal links", () => {
  it("links the Species profile and canonical compatibility reports", () => {
    const links = buildCareGuidePageLinks({
      guide: { id: "guide-id", slug: "betta-splendens" },
      species: betta,
      relatedSpecies: [
        {
          id: "neon-id",
          slug: "neon-tetra",
          commonName: "Neon Tetra",
        },
      ],
    });

    expect(links.speciesProfile[0]?.href).toBe(
      "/species/betta-splendens",
    );
    expect(links.compatibilityReports[0]?.href).toBe(
      "/compatibility/betta-splendens/neon-tetra",
    );
    expect(links.compatibilityReports[0]?.description).toContain(
      "Research whether",
    );
  });

  it("excludes the current guide, unpublished articles, and duplicates", () => {
    const links = buildCareGuidePageLinks({
      guide: { id: "guide-id", slug: "betta-splendens" },
      species: betta,
      relatedCareGuides: [
        {
          id: "guide-id",
          slug: "betta-splendens",
          title: "Betta Care Guide",
          summary: null,
          species: { common_name: "Betta" },
        },
      ],
      relatedArticles: [
        {
          article_id: "draft-id",
          article: {
            slug: "draft",
            title: "Draft",
            summary: null,
            status: "draft",
          },
        },
      ],
    });

    expect(links.relatedCareGuides).toEqual([]);
    expect(links.articles).toEqual([]);
  });

  it("enforces section limits and page-wide target uniqueness", () => {
    const relatedSpecies = Array.from({ length: 6 }, (_, index) => ({
      id: `species-${index}`,
      slug: `species-${index}`,
      commonName: `Species ${index}`,
    }));
    const links = buildCareGuidePageLinks({
      guide: { id: "guide-id", slug: "betta-splendens" },
      species: betta,
      relatedSpecies: [...relatedSpecies, relatedSpecies[0]],
    });
    const hrefs = Object.values(links)
      .flat()
      .map((item) => item.href);

    expect(links.relatedSpecies).toHaveLength(4);
    expect(links.compatibilityReports).toHaveLength(4);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(links.builder[0]?.href).toBe("/aquarium-builder");
  });
});

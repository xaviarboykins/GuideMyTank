import { describe, expect, it } from "vitest";

import { getCompatibilityPath } from "../../src/lib/compatibility/urls";
import { buildArticlePageEntities } from "../../src/lib/seo/schema/article-page";
import { buildCollectionPageEntities } from "../../src/lib/seo/schema/collection-page";
import { buildCompatibilityPageEntities } from "../../src/lib/seo/schema/compatibility-page";
import { composeSchemaGraph } from "../../src/lib/seo/schema/graph";
import { buildHomePageEntities } from "../../src/lib/seo/schema/home";
import { serializeJsonLd } from "../../src/lib/seo/schema/serialize";
import { buildSpeciesPageEntities } from "../../src/lib/seo/schema/species-page";
import type { SchemaEntityInput } from "../../src/lib/seo/schema/types";
import { validateSchemaGraph } from "../../src/lib/seo/schema/validate";

function validateFixture(
  name: string,
  entities: SchemaEntityInput,
  indexable = true,
) {
  const result = composeSchemaGraph(entities);
  expect(result, `${name} graph composition`).toMatchObject({ ok: true });
  if (!result.ok) return null;

  expect(
    validateSchemaGraph(result.graph, { indexable }),
    `${name} graph validation`,
  ).toEqual([]);
  return result.graph;
}

describe("representative GuideMyTank schema validation", () => {
  it("validates Homepage composition", () => {
    validateFixture(
      "Homepage",
      buildHomePageEntities({
        name: "Aquarium Planning Tools",
        description: "Plan a freshwater aquarium.",
      }),
    );
  });

  it("validates Article and Programmatic Guide composition", () => {
    const articlePath = "/learning-center/example";
    validateFixture(
      "Article",
      buildArticlePageEntities({
        path: articlePath,
        headline: "Example Article",
        description: "Visible Article summary.",
        breadcrumbs: [
          { name: "Home", path: "/" },
          { name: "Learning Center", path: "/learning-center" },
          { name: "Example Article", path: articlePath },
        ],
      }),
    );

    const guidePath = "/learning-center/guides/betta-tank-mates";
    validateFixture(
      "Programmatic Guide",
      buildArticlePageEntities({
        path: guidePath,
        headline: "Betta Tank Mates",
        description: "Visible Guide summary.",
        breadcrumbs: [
          { name: "Home", path: "/" },
          { name: "Learning Center", path: "/learning-center" },
          { name: "Guides", path: "/learning-center/guides" },
          { name: "Betta Tank Mates", path: guidePath },
        ],
        visibleFaqs: [
          {
            question: "Can bettas live with snails?",
            answer: "Some combinations can work with observation.",
          },
        ],
      }),
    );
  });

  it("validates Care Guide composition without inferred FAQ schema", () => {
    const path = "/care-guides/betta-splendens";
    const graph = validateFixture(
      "Care Guide",
      buildArticlePageEntities({
        path,
        headline: "Betta Care Guide",
        description: "Visible Care Guide summary.",
        breadcrumbs: [
          { name: "Home", path: "/" },
          { name: "Care Guides", path: "/care-guides" },
          { name: "Betta Care Guide", path },
        ],
      }),
    );

    expect(
      graph?.["@graph"].some((entity) => entity["@type"] === "FAQPage"),
    ).toBe(false);
  });

  it("validates Species composition with missing optional data", () => {
    const path = "/species/example-fish";
    validateFixture(
      "Species",
      buildSpeciesPageEntities({
        slug: "example-fish",
        name: "Example Fish",
        scientificName: null,
        description: "Visible Species summary.",
        breadcrumbs: [
          { name: "Home", path: "/" },
          { name: "Species", path: "/species" },
          { name: "Example Fish", path },
        ],
      }),
    );
  });

  it("validates canonical Compatibility identity in both input orders", () => {
    function graph(speciesA: string, speciesB: string) {
      const path = getCompatibilityPath(speciesA, speciesB);
      const entities = buildCompatibilityPageEntities({
        speciesA: { slug: speciesA, name: speciesA },
        speciesB: { slug: speciesB, name: speciesB },
        name: "Compatibility Report",
        description: "Visible Compatibility summary.",
        breadcrumbs: [
          { name: "Home", path: "/" },
          { name: "Compatibility", path: "/compatibility" },
          { name: "Compatibility Report", path },
        ],
      });
      return validateFixture("Compatibility Report", entities);
    }

    expect(graph("betta-splendens", "guppy")).toEqual(
      graph("guppy", "betta-splendens"),
    );
  });

  it("validates CollectionPage and ordered ItemList composition", () => {
    const path = "/learning-center/guides";
    validateFixture(
      "Guide listing",
      buildCollectionPageEntities({
        path,
        name: "Aquarium Guides",
        description: "Visible Guide listing description.",
        breadcrumbs: [
          { name: "Home", path: "/" },
          { name: "Learning Center", path: "/learning-center" },
          { name: "Guides", path },
        ],
        visibleItems: [
          {
            name: "Betta Tank Mates",
            path: "/learning-center/guides/betta-tank-mates",
          },
        ],
      }),
    );
  });

  it("safely serializes script-breaking fixture content", () => {
    const graph = validateFixture(
      "Unsafe text",
      buildHomePageEntities({
        name: "GuideMyTank </script>",
        description: "Fish < tanks > bowls & ponds\u2028\u2029",
      }),
    );
    const serialized = serializeJsonLd(graph);

    expect(serialized).not.toContain("</script>");
    expect(serialized).not.toContain("<");
    expect(serialized).not.toContain(">");
    expect(serialized).not.toContain("&");
    expect(JSON.parse(serialized)).toEqual(graph);
  });
});

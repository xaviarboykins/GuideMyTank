import { describe, expect, it } from "vitest";

import {
  getBreadcrumbId,
  getSpeciesEntityId,
  getWebPageId,
  ORGANIZATION_ID,
  WEBSITE_ID,
} from "../identities";
import { composeSchemaGraph } from "./graph";
import { buildSpeciesPageEntities } from "./species-page";

describe("Species page composition", () => {
  it("composes a conservative Species subject and WebPage", () => {
    const path = "/species/betta-splendens";
    const result = composeSchemaGraph(
      buildSpeciesPageEntities({
        slug: "betta-splendens",
        name: "Betta",
        scientificName: "Betta splendens",
        description: "Visible Betta profile summary.",
        breadcrumbs: [
          { name: "Home", path: "/" },
          { name: "Species", path: "/species" },
          { name: "Betta", path },
        ],
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.graph?.["@graph"].map((entity) => entity["@id"])).toEqual([
      ORGANIZATION_ID,
      WEBSITE_ID,
      getSpeciesEntityId("betta-splendens"),
      getWebPageId(path),
      getBreadcrumbId(path),
    ]);
  });

  it("omits a missing optional scientific name", () => {
    const entities = buildSpeciesPageEntities({
      slug: "example",
      name: "Example Fish",
      scientificName: null,
      description: "Visible summary.",
      breadcrumbs: [
        { name: "Home", path: "/" },
        { name: "Species", path: "/species" },
        { name: "Example Fish", path: "/species/example" },
      ],
    });
    const subject = entities.find(
      (entity) => entity?.["@type"] === "Thing",
    );

    expect(subject).not.toHaveProperty("alternateName");
  });
});

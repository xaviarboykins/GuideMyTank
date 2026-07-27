import { describe, expect, it } from "vitest";

import {
  getBreadcrumbId,
  getItemListId,
  getWebPageId,
  ORGANIZATION_ID,
  WEBSITE_ID,
} from "../identities";
import { composeSchemaGraph } from "./graph";
import { buildCollectionPageEntities } from "./collection-page";

describe("collection-page composition", () => {
  const path = "/learning-center/guides";
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Learning Center", path: "/learning-center" },
    { name: "Guides", path },
  ];

  it("builds an ordered ItemList from the visible collection", () => {
    const result = composeSchemaGraph(
      buildCollectionPageEntities({
        path,
        name: "Aquarium Guides",
        description: "Visible Guide listing description.",
        breadcrumbs,
        visibleItems: [
          { name: "Betta Tank Mates", path: "/learning-center/guides/betta-tank-mates" },
          { name: "Betta vs Guppy", path: "/learning-center/guides/betta-vs-guppy" },
        ],
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.graph?.["@graph"].map((entity) => entity["@id"])).toEqual([
      ORGANIZATION_ID,
      WEBSITE_ID,
      getWebPageId(path),
      getBreadcrumbId(path),
      getItemListId(path),
    ]);
    const list = result.graph?.["@graph"].find(
      (entity) => entity["@type"] === "ItemList",
    );
    expect(list).toMatchObject({
      numberOfItems: 2,
      itemListElement: [
        { position: 1, name: "Betta Tank Mates" },
        { position: 2, name: "Betta vs Guppy" },
      ],
    });
  });

  it("omits ItemList for a collection without visible items", () => {
    const result = composeSchemaGraph(
      buildCollectionPageEntities({
        path: "/learning-center",
        name: "Learning Center",
        description: "Visible Learning Center description.",
        breadcrumbs: [
          { name: "Home", path: "/" },
          { name: "Learning Center", path: "/learning-center" },
        ],
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(
      result.graph?.["@graph"].some(
        (entity) => entity["@type"] === "ItemList",
      ),
    ).toBe(false);
  });

  it("does not leave a dangling ItemList reference when an item is invalid", () => {
    const result = composeSchemaGraph(
      buildCollectionPageEntities({
        path,
        name: "Aquarium Guides",
        description: "Visible Guide listing description.",
        breadcrumbs,
        visibleItems: [
          { name: null, path: "/learning-center/guides/invalid" },
        ],
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const collection = result.graph?.["@graph"].find(
      (entity) => entity["@type"] === "CollectionPage",
    );
    expect(collection).not.toHaveProperty("mainEntity");
    expect(
      result.graph?.["@graph"].some(
        (entity) => entity["@type"] === "ItemList",
      ),
    ).toBe(false);
  });
});

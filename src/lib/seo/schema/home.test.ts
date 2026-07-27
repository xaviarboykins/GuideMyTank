import { describe, expect, it } from "vitest";

import {
  getWebPageId,
  ORGANIZATION_ID,
  WEBSITE_ID,
} from "../identities";
import { composeSchemaGraph } from "./graph";
import { buildHomePageEntities } from "./home";

describe("Homepage schema composition", () => {
  it("composes one Organization, WebSite, and WebPage", () => {
    const result = composeSchemaGraph(
      buildHomePageEntities({
        name: "Aquarium Planning Tools",
        description: "Plan a freshwater aquarium.",
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.graph?.["@graph"].map((entity) => entity["@id"])).toEqual([
      ORGANIZATION_ID,
      WEBSITE_ID,
      getWebPageId(),
    ]);
    expect(result.graph?.["@graph"]).toHaveLength(3);
  });

  it("omits an invalid Homepage WebPage without affecting global entities", () => {
    const result = composeSchemaGraph(
      buildHomePageEntities({
        name: " ",
        description: "Plan a freshwater aquarium.",
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.graph?.["@graph"]).toHaveLength(2);
  });
});

import { describe, expect, it } from "vitest";

import { buildArticlePageEntities } from "./article-page";
import { composeSchemaGraph } from "./graph";
import { validateSchemaGraph } from "./validate";

describe("schema graph validation", () => {
  function articleGraph() {
    const path = "/learning-center/example";
    const result = composeSchemaGraph(
      buildArticlePageEntities({
        path,
        headline: "Example Article",
        description: "Visible article summary.",
        breadcrumbs: [
          { name: "Home", path: "/" },
          { name: "Learning Center", path: "/learning-center" },
          { name: "Example Article", path },
        ],
      }),
    );
    if (!result.ok) throw new Error("Unexpected fixture conflict.");
    return result.graph;
  }

  it("accepts a valid composed graph", () => {
    expect(validateSchemaGraph(articleGraph(), { indexable: true })).toEqual(
      [],
    );
  });

  it("rejects public content schema for nonindexable content", () => {
    expect(
      validateSchemaGraph(articleGraph(), { indexable: false }).map(
        (issue) => issue.code,
      ),
    ).toContain("nonindexable_public_schema");
  });

  it("detects missing references and invalid ordering", () => {
    const graph = articleGraph();
    if (!graph) throw new Error("Expected fixture graph.");
    const broken = structuredClone(graph);
    const breadcrumbs = broken["@graph"].find(
      (entity) => entity["@type"] === "BreadcrumbList",
    );
    if (breadcrumbs?.["@type"] === "BreadcrumbList") {
      breadcrumbs.itemListElement[0].position = 2;
    }
    broken["@graph"] = broken["@graph"].filter(
      (entity) => entity["@type"] !== "WebSite",
    );

    const codes = validateSchemaGraph(broken).map((issue) => issue.code);
    expect(codes).toContain("invalid_position");
    expect(codes).toContain("missing_reference");
  });
});

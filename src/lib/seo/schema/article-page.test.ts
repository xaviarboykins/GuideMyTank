import { describe, expect, it } from "vitest";

import {
  getArticleId,
  getBreadcrumbId,
  getFaqId,
  getWebPageId,
  ORGANIZATION_ID,
  WEBSITE_ID,
} from "../identities";
import { composeSchemaGraph } from "./graph";
import { buildArticlePageEntities } from "./article-page";

describe("shared Article-page composition", () => {
  it("composes Article content, breadcrumbs, and visible FAQs", () => {
    const path = "/learning-center/guides/betta-tank-mates";
    const result = composeSchemaGraph(
      buildArticlePageEntities({
        path,
        headline: "Betta Tank Mates",
        description: "Visible guide summary.",
        datePublished: "2026-07-20T12:00:00.000Z",
        dateModified: "2026-07-21T12:00:00.000Z",
        articleSection: "Tank Mate Guides",
        keywords: ["betta", "tank mates"],
        breadcrumbs: [
          { name: "Home", path: "/" },
          { name: "Learning Center", path: "/learning-center" },
          { name: "Guides", path: "/learning-center/guides" },
          { name: "Betta Tank Mates", path },
        ],
        visibleFaqs: [
          {
            question: "Can bettas live with snails?",
            answer: "Some combinations can work with observation.",
          },
        ],
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.graph?.["@graph"].map((entity) => entity["@id"])).toEqual([
      ORGANIZATION_ID,
      WEBSITE_ID,
      getWebPageId(path),
      getArticleId(path),
      getBreadcrumbId(path),
      getFaqId(path),
    ]);
  });

  it("omits FAQPage when no visible FAQs are supplied", () => {
    const path = "/care-guides/betta";
    const result = composeSchemaGraph(
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

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(
      result.graph?.["@graph"].some(
        (entity) => entity["@type"] === "FAQPage",
      ),
    ).toBe(false);
  });
});

import { describe, expect, it } from "vitest";

import { getAnalyticsPageFamily } from "./page-family";

describe("analytics page-family classification", () => {
  it.each([
    ["/", "homepage"],
    ["/species/betta-splendens", "species"],
    ["/care-guides/betta-splendens", "care_guide"],
    ["/learning-center/popular-fish", "article"],
    ["/learning-center/guides/betta-vs-guppy", "guide"],
    ["/learning-center/guides", "learning_center"],
    ["/compatibility/betta-splendens/guppy", "compatibility_report"],
    ["/aquarium-builder/products/filters", "product_category"],
    ["/aquarium-builder/livestock", "aquarium_builder"],
    ["/privacy", "static"],
  ])("classifies %s as %s", (pathname, family) => {
    expect(getAnalyticsPageFamily(pathname)).toBe(family);
  });
});

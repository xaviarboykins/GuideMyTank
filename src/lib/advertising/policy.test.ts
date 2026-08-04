import { describe, expect, it } from "vitest";

import {
  getAdvertisingPageFamily,
  isPlacementEligible,
  isRouteAdvertisingAllowed,
} from "./policy";

describe("advertising route policy", () => {
  it.each([
    ["/learning-center/popular-fish", "article"],
    ["/learning-center/guides/betta-tank-size", "programmatic-guide"],
    ["/care-guides/betta-splendens", "care-guide"],
    [
      "/compatibility/betta-splendens/neon-tetra",
      "compatibility-report",
    ],
  ] as const)("classifies %s as %s", (pathname, family) => {
    expect(getAdvertisingPageFamily(pathname)).toBe(family);
    expect(isRouteAdvertisingAllowed(pathname, family)).toBe(true);
  });

  it.each([
    "/",
    "/admin",
    "/admin/care-guides/123/preview",
    "/aquarium-builder",
    "/aquarium-builder/livestock",
    "/auth/login",
    "/api/compatibility",
    "/compatibility",
    "/care-guides/betta-splendens/pdf",
    "/learning-center",
    "/products",
    "/privacy",
  ])("prohibits advertising on %s", (pathname) => {
    expect(getAdvertisingPageFamily(pathname)).toBeNull();
  });

  it("requires the matching page family and minimum content", () => {
    expect(
      isPlacementEligible({
        placement: "article-in-content",
        pageFamily: "article",
        contentUnits: 4,
      }),
    ).toBe(true);
    expect(
      isPlacementEligible({
        placement: "article-in-content",
        pageFamily: "article",
        contentUnits: 3,
      }),
    ).toBe(false);
    expect(
      isPlacementEligible({
        placement: "article-in-content",
        pageFamily: "care-guide",
        contentUnits: 10,
      }),
    ).toBe(false);
  });
});

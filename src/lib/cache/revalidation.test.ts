import { describe, expect, it } from "vitest";

import { CACHE_TTL } from "./policy";
import {
  getCompatibilityRevalidationPaths,
  getEditorialRevalidationPaths,
  getProductRevalidationPaths,
  getSpeciesRevalidationPaths,
} from "./revalidation";

describe("cache policy", () => {
  it("keeps evergreen families on long safety fallbacks", () => {
    expect(CACHE_TTL.species).toBe(604_800);
    expect(CACHE_TTL.compatibility).toBe(2_592_000);
    expect(CACHE_TTL.sitemap).toBe(86_400);
  });
});

describe("targeted revalidation paths", () => {
  it("normalizes compatibility pair ordering", () => {
    expect(getCompatibilityRevalidationPaths("zebra", "alpha")[0]).toBe(
      "/compatibility/alpha/zebra",
    );
  });

  it("invalidates old and new editorial slugs and public indexes", () => {
    expect(
      getEditorialRevalidationPaths("article", ["old-slug", "new-slug"]),
    ).toEqual(
      expect.arrayContaining([
        "/learning-center/old-slug",
        "/learning-center/new-slug",
        "/learning-center",
        "/learning-center/sitemap.xml",
      ]),
    );
  });

  it("limits species invalidation to supplied compatibility pairs", () => {
    const paths = getSpeciesRevalidationPaths("betta", ["guppy", "tetra"]);
    expect(paths).toContain("/compatibility/betta/guppy");
    expect(paths).toContain("/compatibility/betta/tetra");
    expect(paths).not.toContain("/compatibility/[speciesA]/[speciesB]");
  });

  it("targets product detail, category, index, and optional inventory", () => {
    expect(
      getProductRevalidationPaths({
        slug: "quiet-filter",
        category: "filters",
        publicInventoryChanged: true,
      }),
    ).toEqual([
      "/products",
      "/products/quiet-filter",
      "/aquarium-builder/products/filters",
      "/sitemap.xml",
    ]);
  });
});

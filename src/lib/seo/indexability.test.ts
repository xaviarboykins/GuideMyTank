import { describe, expect, it } from "vitest";

import {
  getSearchVariantRobots,
  hasActiveSearchParams,
  NOINDEX_FOLLOW,
} from "./indexability";

describe("SEO indexability", () => {
  it("keeps unfiltered directory pages indexable", () => {
    expect(hasActiveSearchParams({})).toBe(false);
    expect(hasActiveSearchParams({ q: "", category: undefined })).toBe(false);
    expect(getSearchVariantRobots({})).toBeUndefined();
  });

  it("noindexes search and filter variants while preserving link crawling", () => {
    expect(hasActiveSearchParams({ q: "neon tetra" })).toBe(true);
    expect(hasActiveSearchParams({ rating: ["", "4"] })).toBe(true);
    expect(getSearchVariantRobots({ q: "neon tetra" })).toEqual(
      NOINDEX_FOLLOW,
    );
  });
});

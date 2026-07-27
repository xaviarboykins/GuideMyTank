import { describe, expect, it } from "vitest";

import {
  getPublicationRobots,
  getSearchVariantRobots,
  hasActiveSearchParams,
  NOINDEX_FOLLOW,
  NOINDEX_NOFOLLOW,
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

  it("keeps only published content indexable", () => {
    expect(getPublicationRobots("published")).toBeUndefined();
    expect(getPublicationRobots("draft")).toEqual(NOINDEX_NOFOLLOW);
    expect(getPublicationRobots("archived")).toEqual(NOINDEX_NOFOLLOW);
    expect(getPublicationRobots("rejected")).toEqual(NOINDEX_NOFOLLOW);
    expect(getPublicationRobots(null)).toEqual(NOINDEX_NOFOLLOW);
  });
});

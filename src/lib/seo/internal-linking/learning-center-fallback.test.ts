import { describe, expect, it } from "vitest";

import { buildLearningCenterFallbackLinks } from "./learning-center-fallback";

const candidates = [
  { id: "new", slug: "new-article", title: "New article", summary: null, content_type: "article", published_at: "2026-09-03" },
  { id: "middle", slug: "middle-guide", title: "Middle guide", summary: "A guide", content_type: "guide", published_at: "2026-09-02" },
  { id: "old", slug: "old-article", title: "Old article", summary: null, content_type: "article", published_at: "2026-09-01" },
];

describe("Learning Center fallback links", () => {
  it("links a published item to its adjacent content in both directions", () => {
    expect(buildLearningCenterFallbackLinks("middle", candidates).map((item) => item.href)).toEqual([
      "/learning-center/new-article",
      "/learning-center/old-article",
    ]);
  });

  it("wraps the published sequence so every item receives an inbound link", () => {
    expect(buildLearningCenterFallbackLinks("new", candidates).map((item) => item.href)).toEqual([
      "/learning-center/old-article",
      "/learning-center/guides/middle-guide",
    ]);
  });

  it("does not link a page to itself when it is the only candidate", () => {
    expect(buildLearningCenterFallbackLinks("new", [candidates[0]])).toEqual([]);
  });
});

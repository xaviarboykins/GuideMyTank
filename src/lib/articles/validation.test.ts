import { describe, expect, it } from "vitest";

import { validateArticleForPublication } from "./validation";

describe("article publication validation", () => {
  it("publishes without any image data", () => {
    expect(validateArticleForPublication({
      title: "Cycling an Aquarium",
      slug: "cycling-an-aquarium",
      summary: "How to establish a biological filter.",
      sections: [{ blockType: "paragraph", content: { text: "Start with patience." } }],
      slugAvailable: true,
    })).toEqual({ valid: true, issues: [] });
  });

  it("rejects an article without content", () => {
    const result = validateArticleForPublication({
      title: "Empty",
      slug: "empty",
      summary: "Not complete.",
      sections: [],
      slugAvailable: true,
    });
    expect(result.issues).toEqual([expect.objectContaining({ field: "sections" })]);
  });
});


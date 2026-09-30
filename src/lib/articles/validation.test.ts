import { describe, expect, it } from "vitest";

import { validateArticleForPublication } from "./validation";

describe("article publication validation", () => {
  it("publishes a substantial article without any image data", () => {
    expect(validateArticleForPublication({
      title: "Cycling an Aquarium",
      slug: "cycling-an-aquarium",
      summary: "How to establish a biological filter.",
      sections: [{ blockType: "paragraph", content: { text: Array.from({ length: 900 }, () => "aquarium").join(" ") } }],
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
    expect(result.issues).toEqual([
      expect.objectContaining({ field: "sections", code: "minimum" }),
      expect.objectContaining({ field: "sections", code: "minimum_word_count" }),
    ]);
  });

  it("rejects a thin editorial", () => {
    const result = validateArticleForPublication({
      title: "Short Aquarium Note",
      slug: "short-aquarium-note",
      summary: "A valid but undersized editorial draft.",
      sections: [{ blockType: "paragraph", content: { text: "Useful but short." } }],
      slugAvailable: true,
    });

    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: "minimum_word_count" }),
    );
  });
});


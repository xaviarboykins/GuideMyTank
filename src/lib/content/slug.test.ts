import { describe, expect, it } from "vitest";

import { normalizeContentSlug, validateContentSlug } from "./slug";

describe("content slugs", () => {
  it("normalizes a title to the repository slug format", () => {
    expect(normalizeContentSlug("  Beginner’s Betta Guide! ")).toBe("beginners-betta-guide");
  });

  it("rejects reserved and malformed slugs", () => {
    expect(validateContentSlug("admin")).toEqual(expect.arrayContaining([expect.objectContaining({ code: "reserved" })]));
    expect(validateContentSlug("Bad Slug")).toEqual(expect.arrayContaining([expect.objectContaining({ code: "format" })]));
  });
});


import { describe, expect, it } from "vitest";

import {
  generateCanonicalCompatibilityPairs,
  getCanonicalCompatibilityPair,
  getCompatibilityPath,
  isCanonicalCompatibilityPair,
} from "./urls";

describe("compatibility URL canonicalization", () => {
  it("uses the same canonical path regardless of species order", () => {
    expect(getCompatibilityPath("zebra-danio", "ember-tetra")).toBe(
      "/compatibility/ember-tetra/zebra-danio",
    );
    expect(getCompatibilityPath("ember-tetra", "zebra-danio")).toBe(
      "/compatibility/ember-tetra/zebra-danio",
    );
  });

  it("identifies only the alphabetically ordered pair as canonical", () => {
    expect(isCanonicalCompatibilityPair("ember-tetra", "zebra-danio")).toBe(
      true,
    );
    expect(isCanonicalCompatibilityPair("zebra-danio", "ember-tetra")).toBe(
      false,
    );
  });

  it("generates each distinct species pair exactly once", () => {
    const pairs = generateCanonicalCompatibilityPairs([
      { slug: "zebra-danio" },
      { slug: "ember-tetra" },
      { slug: "betta-splendens" },
    ]);

    expect(pairs).toHaveLength(3);
    expect(
      new Set(pairs.map((pair) => `${pair.speciesA}/${pair.speciesB}`)).size,
    ).toBe(3);
    expect(pairs).toContainEqual(
      getCanonicalCompatibilityPair("zebra-danio", "ember-tetra"),
    );
  });
});

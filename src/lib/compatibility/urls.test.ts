import { describe, expect, it } from "vitest";

import {
  generateCanonicalCompatibilityPairBatch,
  generateCanonicalCompatibilityPairs,
  getCanonicalCompatibilityPair,
  getCanonicalCompatibilityPairCount,
  getCompatibilityPath,
  isCanonicalCompatibilityPair,
  isCompatibilitySitemapSegment,
} from "./urls";

describe("compatibility URL canonicalization", () => {
  it("distinguishes the framework sitemap route from a species pair", () => {
    expect(isCompatibilitySitemapSegment("sitemap")).toBe(true);
    expect(isCompatibilitySitemapSegment("ember-tetra")).toBe(false);
  });

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

  it("batches canonical pairs without overlap", () => {
    const species = [
      { slug: "zebra-danio" },
      { slug: "ember-tetra" },
      { slug: "betta-splendens" },
      { slug: "neon-tetra" },
    ];
    const firstBatch = generateCanonicalCompatibilityPairBatch(species, 0, 4);
    const secondBatch = generateCanonicalCompatibilityPairBatch(species, 4, 4);
    const combined = [...firstBatch, ...secondBatch];

    expect(getCanonicalCompatibilityPairCount(species.length)).toBe(6);
    expect(combined).toHaveLength(6);
    expect(new Set(combined.map((pair) => `${pair.speciesA}/${pair.speciesB}`)).size).toBe(6);
    expect(combined.every((pair) => pair.speciesA < pair.speciesB)).toBe(true);
  });
});

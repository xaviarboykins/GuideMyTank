import { describe, expect, it } from "vitest";

import {
  getSpeciesImage,
  hasSpeciesImage,
  normalizeSpeciesSlug,
  resolveSpeciesImage,
  SPECIES_PLACEHOLDER_IMAGE,
} from "./images";

describe("species images", () => {
  it("normalizes species slugs before resolving the controlled fallback", () => {
    expect(normalizeSpeciesSlug(" Betta Splendens ")).toBe("betta-splendens");
    expect(getSpeciesImage(" Betta Splendens ")).toBe(SPECIES_PLACEHOLDER_IMAGE);
    expect(hasSpeciesImage("BETTA_SPLENDENS")).toBe(false);
  });

  it("retains a legacy source when the local production set is empty", () => {
    expect(resolveSpeciesImage("betta-splendens", "https://example.com/fish.png"))
      .toBe("https://example.com/fish.png");
  });

  it("retains an intentional legacy source when no local asset exists", () => {
    expect(resolveSpeciesImage("neon-tetra", "https://example.com/fish.png"))
      .toBe("https://example.com/fish.png");
  });

  it("uses the controlled placeholder when no source is available", () => {
    expect(resolveSpeciesImage("neon-tetra")).toBe(SPECIES_PLACEHOLDER_IMAGE);
  });
});

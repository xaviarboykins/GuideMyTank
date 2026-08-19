import { describe, expect, it } from "vitest";

import {
  getSpeciesImage,
  hasSpeciesImage,
  normalizeSpeciesSlug,
  resolveSpeciesImage,
  SPECIES_PLACEHOLDER_IMAGE,
} from "./images";

describe("species images", () => {
  it("normalizes species slugs before resolving local assets", () => {
    expect(normalizeSpeciesSlug(" Betta Splendens ")).toBe("betta-splendens");
    expect(getSpeciesImage(" Betta Splendens ")).toBe(
      "/species/betta-splendens.webp",
    );
    expect(hasSpeciesImage("BETTA_SPLENDENS")).toBe(true);
  });

  it("prefers an approved local image over a legacy source", () => {
    expect(resolveSpeciesImage("betta-splendens", "https://example.com/fish.png"))
      .toBe("/species/betta-splendens.webp");
  });

  it("retains an intentional legacy source when no local asset exists", () => {
    expect(resolveSpeciesImage("neon-tetra", "https://example.com/fish.png"))
      .toBe("https://example.com/fish.png");
  });

  it("uses the controlled placeholder when no source is available", () => {
    expect(resolveSpeciesImage("neon-tetra")).toBe(SPECIES_PLACEHOLDER_IMAGE);
  });
});

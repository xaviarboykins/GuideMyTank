import { describe, expect, it } from "vitest";

import {
  createComparisonGenerationKey,
  createExtensibleGenerationKey,
  createTankMateGenerationKey,
  createTankSizeGenerationKey,
  normalizeSearchIntent,
} from "./identity";

describe("Guide generation identity", () => {
  it("normalizes comparison pairs independently of selection order", () => {
    expect(createComparisonGenerationKey("Betta", "Honey Gourami")).toBe(
      "comparison:betta-honey-gourami",
    );
    expect(createComparisonGenerationKey("Honey Gourami", "Betta")).toBe(
      "comparison:betta-honey-gourami",
    );
  });

  it("rejects self comparisons", () => {
    expect(() => createComparisonGenerationKey("Betta", "betta")).toThrow(
      "two different species",
    );
  });

  it("creates tank-mate and avoid-with keys", () => {
    expect(createTankMateGenerationKey("Betta Splendens")).toBe(
      "tank-mates:betta-splendens",
    );
    expect(createTankMateGenerationKey("Angelfish", "avoid-with")).toBe(
      "avoid-with:angelfish",
    );
  });

  it("creates tank-size keys with optional variations", () => {
    expect(createTankSizeGenerationKey(20)).toBe("tank-size:20-gallon");
    expect(createTankSizeGenerationKey(40, "Community")).toBe(
      "tank-size:40-gallon-community",
    );
    expect(() => createTankSizeGenerationKey(2.5)).toThrow(
      "positive whole number",
    );
  });

  it("supports future family namespaces", () => {
    expect(
      createExtensibleGenerationKey("Beginner Guides", ["Low Tech", "10"]),
    ).toBe("beginner-guides:low-tech-10");
  });

  it("normalizes search intent with controlled rules", () => {
    expect(normalizeSearchIntent("  Betta’s BEST Tank-Mates & Friends! ")).toBe(
      "bettas best tank mates and friends",
    );
  });
});


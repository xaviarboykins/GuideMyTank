import { describe, expect, it } from "vitest";

import {
  normalizeInternalPath,
  resolveInternalLinkPath,
} from "./route-resolver";

describe("internal-link route resolution", () => {
  it("resolves canonical content routes", () => {
    expect(
      resolveInternalLinkPath({
        entityType: "species",
        slug: "betta-splendens",
      }),
    ).toBe("/species/betta-splendens");
    expect(
      resolveInternalLinkPath({
        entityType: "care-guide",
        slug: "betta-care",
      }),
    ).toBe("/care-guides/betta-care");
    expect(
      resolveInternalLinkPath({
        entityType: "article",
        slug: "beginner-fish",
      }),
    ).toBe("/learning-center/beginner-fish");
    expect(resolveInternalLinkPath({ entityType: "builder" })).toBe(
      "/aquarium-builder",
    );
  });

  it("reuses canonical compatibility pair ordering", () => {
    const forward = resolveInternalLinkPath({
      entityType: "compatibility-report",
      speciesASlug: "neon-tetra",
      speciesBSlug: "betta-splendens",
    });
    const reverse = resolveInternalLinkPath({
      entityType: "compatibility-report",
      speciesASlug: "betta-splendens",
      speciesBSlug: "neon-tetra",
    });

    expect(forward).toBe(
      "/compatibility/betta-splendens/neon-tetra",
    );
    expect(reverse).toBe(forward);
  });

  it("rejects invalid and self-paired compatibility targets", () => {
    expect(
      resolveInternalLinkPath({
        entityType: "species",
        slug: "Not A Slug",
      }),
    ).toBeNull();
    expect(
      resolveInternalLinkPath({
        entityType: "compatibility-report",
        speciesASlug: "neon-tetra",
        speciesBSlug: "neon-tetra",
      }),
    ).toBeNull();
  });

  it("only resolves known product categories", () => {
    expect(
      resolveInternalLinkPath({
        entityType: "product-category",
        category: "heaters",
      }),
    ).toBe("/aquarium-builder/products/heaters");
  });

  it("normalizes internal cluster hubs and rejects external URLs", () => {
    expect(
      resolveInternalLinkPath({
        entityType: "topic-cluster",
        hubHref: "/compatibility/betta/?ref=cluster#reports",
      }),
    ).toBe("/compatibility/betta");
    expect(normalizeInternalPath("https://example.com/species/betta")).toBeNull();
    expect(normalizeInternalPath("//example.com/species/betta")).toBeNull();
  });
});

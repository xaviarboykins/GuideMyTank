import { describe, expect, it, vi } from "vitest";

import type {
  AquariumBuild,
  AquariumResolvedLivestockEntry,
  AquariumSpecies,
} from "@/lib/aquarium-builder/types";
import type { CompatibilityResult } from "@/lib/compatibility/types";

import { validateAquarium } from "./engine";
import { compatibilityValidator } from "./validators/compatibility";

const build: AquariumBuild = {
  tank: {
    sizeGallons: 20,
    filtrationLevel: "standard",
    plantedLevel: "none",
  },
  livestock: [],
  plants: [],
  equipment: [],
};

function livestock(id: string): AquariumResolvedLivestockEntry {
  return {
    speciesSlug: `slug-${id}`,
    quantity: 1,
    species: {
      id,
      slug: `slug-${id}`,
      common_name: `Species ${id}`,
    } as AquariumSpecies,
  };
}

function compatibleResult(
  speciesASlug: string,
  speciesBSlug: string,
): CompatibilityResult {
  return {
    score: 90,
    status: "Very Compatible",
    reasons: [],
    compatibility: "compatible",
    confidence: 0.9,
    notes: null,
    expertValidated: false,
    species_a: { slug: speciesASlug, common_name: speciesASlug },
    species_b: { slug: speciesBSlug, common_name: speciesBSlug },
  };
}

describe("compatibility engine integration", () => {
  it("resolves each of three unique species pairs exactly once", async () => {
    const compatibilityResolver = vi.fn(async (speciesASlug, speciesBSlug) =>
      compatibleResult(speciesASlug, speciesBSlug),
    );

    await validateAquarium(build, {
      context: {
        species: [livestock("c"), livestock("a"), livestock("b")],
      },
      validators: [compatibilityValidator],
      compatibilityResolver,
    });

    expect(compatibilityResolver).toHaveBeenCalledTimes(3);
    expect(compatibilityResolver.mock.calls).toEqual([
      ["slug-a", "slug-b"],
      ["slug-a", "slug-c"],
      ["slug-b", "slug-c"],
    ]);
  });

  it("does not repeat calls for duplicate livestock species", async () => {
    const compatibilityResolver = vi.fn(async (speciesASlug, speciesBSlug) =>
      compatibleResult(speciesASlug, speciesBSlug),
    );

    await validateAquarium(build, {
      context: {
        species: [livestock("a"), livestock("a"), livestock("b")],
      },
      validators: [compatibilityValidator],
      compatibilityResolver,
    });

    expect(compatibilityResolver).toHaveBeenCalledTimes(1);
    expect(compatibilityResolver).toHaveBeenCalledWith("slug-a", "slug-b");
  });

  it("produces pair-order-independent calls and reports", async () => {
    const resolverA = vi.fn(async () => ({
      ...compatibleResult("slug-a", "slug-b"),
      compatibility: "incompatible" as const,
      status: "Incompatible" as const,
    }));
    const resolverB = vi.fn(async () => ({
      ...compatibleResult("slug-a", "slug-b"),
      compatibility: "incompatible" as const,
      status: "Incompatible" as const,
    }));
    const reportA = await validateAquarium(build, {
      context: { species: [livestock("a"), livestock("b")] },
      validators: [compatibilityValidator],
      compatibilityResolver: resolverA,
      now: () => new Date("2026-07-16T00:00:00.000Z"),
    });
    const reportB = await validateAquarium(build, {
      context: { species: [livestock("b"), livestock("a")] },
      validators: [compatibilityValidator],
      compatibilityResolver: resolverB,
      now: () => new Date("2026-07-16T00:00:00.000Z"),
    });

    expect(resolverA.mock.calls).toEqual(resolverB.mock.calls);
    expect(reportA).toEqual(reportB);
  });

  it("reuses supplied compatibility results without service calls", async () => {
    const compatibilityResolver = vi.fn(async (speciesASlug, speciesBSlug) =>
      compatibleResult(speciesASlug, speciesBSlug),
    );

    await validateAquarium(build, {
      context: {
        species: [livestock("a"), livestock("b")],
        compatibilityResults: [
          {
            speciesAId: "a",
            speciesBId: "b",
            result: compatibleResult("slug-a", "slug-b"),
          },
        ],
      },
      validators: [compatibilityValidator],
      compatibilityResolver,
    });

    expect(compatibilityResolver).not.toHaveBeenCalled();
  });

  it("returns an unknown finding and continues when resolution fails", async () => {
    const onCompatibilityError = vi.fn();
    const report = await validateAquarium(build, {
      context: { species: [livestock("a"), livestock("b")] },
      validators: [compatibilityValidator],
      compatibilityResolver: async () => {
        throw new Error("private service failure");
      },
      onCompatibilityError,
    });

    expect(report.valid).toBe(true);
    expect(report.issues).toHaveLength(1);
    expect(report.issues[0]).toMatchObject({
      code: "COMPATIBILITY_UNKNOWN",
      severity: "info",
    });
    expect(JSON.stringify(report)).not.toContain("private service failure");
    expect(onCompatibilityError).toHaveBeenCalledWith(
      "a:b",
      expect.any(Error),
    );
  });
});

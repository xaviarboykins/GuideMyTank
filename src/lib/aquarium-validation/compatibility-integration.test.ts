import { describe, expect, it, vi } from "vitest";

import type {
  AquariumBuild,
  AquariumResolvedLivestockEntry,
  AquariumSpecies,
} from "@/lib/aquarium-builder/types";
import type { CompatibilityResult } from "@/lib/compatibility/types";

import { validateAquarium } from "./engine";
import {
  compatibilityValidator,
  schoolSizeValidator,
  tankSizeValidator,
  territorialValidator,
} from "./validators";

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

function livestock(
  id: string,
  overrides: Partial<AquariumSpecies> = {},
  quantity = 1,
): AquariumResolvedLivestockEntry {
  return {
    speciesSlug: `slug-${id}`,
    quantity,
    species: {
      id,
      slug: `slug-${id}`,
      common_name: `Species ${id}`,
      compatibility_tags: [],
      aggression_level: null,
      temperament: null,
      breeding_aggression: false,
      species_only_preferred: false,
      ...overrides,
    } as AquariumSpecies,
  };
}

function compatibleResult(
  speciesASlug: string,
  speciesBSlug: string,
): CompatibilityResult {
  return {
    score: 90,
    status: "High Compatibility",
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

  it("keeps pair compatibility independent from the selected tank size", async () => {
    const smallTankBuild: AquariumBuild = {
      ...build,
      tank: { ...build.tank, sizeGallons: 10 },
    };
    const report = await validateAquarium(smallTankBuild, {
      context: {
        species: [
          livestock("a", { tank_size_gal: 20 }),
          livestock("b", { tank_size_gal: 30 }),
        ],
      },
      validators: [compatibilityValidator, tankSizeValidator],
      compatibilityResolver: async (speciesASlug, speciesBSlug) =>
        compatibleResult(speciesASlug, speciesBSlug),
    });

    expect(
      report.issues.filter((issue) => issue.category === "compatibility"),
    ).toEqual([]);
    expect(
      report.issues.filter((issue) => issue.category === "tank_size"),
    ).toHaveLength(2);
  });

  it("uses livestock quantity for school context without repeating pair resolution", async () => {
    const compatibilityResolver = vi.fn(
      async (speciesASlug, speciesBSlug) =>
        compatibleResult(speciesASlug, speciesBSlug),
    );
    const report = await validateAquarium(build, {
      context: {
        species: [
          livestock("a", { min_group_size: 6 }, 2),
          livestock("a", { min_group_size: 6 }, 1),
          livestock("b"),
        ],
      },
      validators: [compatibilityValidator, schoolSizeValidator],
      compatibilityResolver,
    });

    expect(compatibilityResolver).toHaveBeenCalledTimes(1);
    expect(report.issues).toContainEqual(
      expect.objectContaining({
        code: "SCHOOL_SIZE_BELOW_MINIMUM",
        category: "school_size",
        metadata: expect.objectContaining({
          currentQuantity: 3,
          recommendedMinimum: 6,
        }),
      }),
    );
  });

  it("routes territorial compatibility evidence into Builder context", async () => {
    const territorialResult: CompatibilityResult = {
      ...compatibleResult("slug-a", "slug-b"),
      score: 60,
      status: "Caution",
      compatibility: "caution",
      reasons: [
        "Closely related fish sharing a swimming zone may recognize each other as territorial rivals.",
      ],
    };
    const report = await validateAquarium(build, {
      context: { species: [livestock("a"), livestock("b")] },
      validators: [compatibilityValidator, territorialValidator],
      compatibilityResolver: async () => territorialResult,
    });

    expect(report.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "COMPATIBILITY_CAUTION",
          category: "compatibility",
        }),
        expect.objectContaining({
          code: "TERRITORIAL_PAIR_CONFLICT",
          category: "territorial",
        }),
      ]),
    );
  });
});

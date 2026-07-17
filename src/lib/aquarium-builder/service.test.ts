import { describe, expect, it, vi } from "vitest";

vi.mock("../data/species", () => ({
  getSpeciesBySlug: vi.fn(),
}));
vi.mock("../compatibility/service", () => ({
  getCompatibility: vi.fn(),
}));
vi.mock("../products/service", () => ({
  getProductById: vi.fn(),
}));

import { analyzeStocking } from "./stocking-analysis/index";
import type {
  AquariumBuild,
  AquariumSpecies,
} from "./types";
import { analyzeAquariumBuild } from "./service";
import type { CompatibilityResult } from "@/lib/compatibility/types";
import type { Product } from "@/lib/products/types";

function build(livestock: AquariumBuild["livestock"] = []): AquariumBuild {
  return {
    tank: {
      sizeGallons: 20,
      filtrationLevel: "standard",
      plantedLevel: "none",
    },
    livestock,
    plants: [],
    equipment: [],
  };
}

function species(id: string): AquariumSpecies {
  return {
    id,
    slug: `species-${id}`,
    common_name: `Species ${id}`,
    bioload_rating: 2,
    min_temp_f: 72,
    max_temp_f: 78,
  } as AquariumSpecies;
}

function compatibility(
  speciesASlug: string,
  speciesBSlug: string,
): CompatibilityResult {
  return {
    score: 85,
    status: "Very Compatible",
    reasons: ["Compatible test pair."],
    compatibility: "compatible",
    confidence: 0.9,
    notes: null,
    expertValidated: false,
    species_a: { slug: speciesASlug, common_name: speciesASlug },
    species_b: { slug: speciesBSlug, common_name: speciesBSlug },
  };
}

describe("analyzeAquariumBuild orchestration", () => {
  it("resolves livestock once and compatibility once per unique pair", async () => {
    const selectedBuild = build([
      { speciesSlug: "species-a", quantity: 2 },
      { speciesSlug: "species-b", quantity: 3 },
    ]);
    const speciesBySlug = new Map([
      ["species-a", species("a")],
      ["species-b", species("b")],
    ]);
    const speciesResolver = vi.fn(async (slug: string) =>
      speciesBySlug.get(slug) ?? null,
    );
    const compatibilityResolver = vi.fn(async (slugA: string, slugB: string) =>
      compatibility(slugA, slugB),
    );

    const result = await analyzeAquariumBuild(selectedBuild, {
      speciesResolver,
      compatibilityResolver,
      now: () => new Date("2026-07-17T12:00:00.000Z"),
    });

    expect(speciesResolver).toHaveBeenCalledTimes(2);
    expect(compatibilityResolver).toHaveBeenCalledTimes(1);
    expect(result.analysis.compatibility).toHaveLength(1);
    expect(result.analysis.validation.evaluatedAt).toBe(
      "2026-07-17T12:00:00.000Z",
    );
    expect(result.analysis.buildHealth.status).toBeDefined();
  });

  it("reuses a supplied stocking result in both analysis and validation", async () => {
    const suppliedStocking = analyzeStocking({
      tankGallons: 5,
      filtrationLevel: "standard",
      plantedLevel: "none",
      livestock: [
        {
          speciesId: "test",
          speciesName: "Test species",
          quantity: 1,
          bioloadScore: 10,
        },
      ],
    });

    const result = await analyzeAquariumBuild(build(), {
      stockingAnalysis: suppliedStocking,
      now: () => new Date("2026-07-17T12:00:00.000Z"),
    });

    expect(result.analysis.stocking).toBe(suppliedStocking);
    expect(result.analysis.validation.issues).toContainEqual(
      expect.objectContaining({ code: "STOCKING_OVER_CAPACITY" }),
    );
  });

  it("returns deterministic empty-build analysis with an injected clock", async () => {
    const emptyBuild = build();
    const dependencies = {
      now: () => new Date("2026-07-17T12:00:00.000Z"),
    };

    const first = await analyzeAquariumBuild(emptyBuild, dependencies);
    const second = await analyzeAquariumBuild(emptyBuild, dependencies);

    expect(second).toEqual(first);
  });

  it("resolves the selected heater once and supplies it to validation", async () => {
    const selectedBuild = build();
    selectedBuild.equipment = [
      {
        productId: "heater-1",
        name: "Test Heater",
        category: "heater",
        quantity: 1,
        estimatedPrice: 30,
      },
    ];
    selectedBuild.equipmentProductIds = { heaterProductId: "heater-1" };
    const heaterProductResolver = vi.fn(async () =>
      ({
        id: "heater-1",
        category: "heaters",
        title: "Test Heater",
        recommended_tank_min_gallons: 10,
        recommended_tank_max_gallons: 30,
        is_active: true,
      }) as Product,
    );

    const result = await analyzeAquariumBuild(selectedBuild, {
      heaterProductResolver,
      now: () => new Date("2026-07-17T12:00:00.000Z"),
    });

    expect(heaterProductResolver).toHaveBeenCalledOnce();
    expect(heaterProductResolver).toHaveBeenCalledWith("heater-1");
    expect(result.analysis.validation.issues).not.toContainEqual(
      expect.objectContaining({ code: "HEATER_SPECIFICATION_MISSING" }),
    );
  });
});

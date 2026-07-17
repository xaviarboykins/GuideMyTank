import { describe, expect, it } from "vitest";

import type {
  AquariumBuild,
  AquariumResolvedLivestockEntry,
  AquariumSpecies,
} from "@/lib/aquarium-builder/types";
import type { Product } from "@/lib/products/types";

import { AQUARIUM_VALIDATION_CODES } from "../constants";
import type { AquariumValidatorContext } from "../types";
import { analyzeHeaterRequirement, heatingValidator } from "./heating";

function species(
  id: string,
  minimum: number | null,
  maximum: number | null,
  fallbackMinimum: number | null = null,
  fallbackMaximum: number | null = null,
): AquariumSpecies {
  return {
    id,
    slug: `species-${id}`,
    common_name: `Species ${id}`,
    recommended_min_temp_f: minimum,
    recommended_max_temp_f: maximum,
    min_temp_f: fallbackMinimum,
    max_temp_f: fallbackMaximum,
  } as AquariumSpecies;
}

function livestock(item: AquariumSpecies): AquariumResolvedLivestockEntry {
  return { speciesSlug: item.slug, quantity: 1, species: item };
}

function heater(overrides: Partial<Product> = {}): Product {
  return {
    id: "heater-1",
    slug: "heater-1",
    category: "heaters",
    brand: "Test",
    model: "100W",
    title: "Test Heater",
    description: null,
    short_description: null,
    image_url: null,
    recommended_tank_min_gallons: 10,
    recommended_tank_max_gallons: 30,
    freshwater: true,
    saltwater: false,
    planted_tank: true,
    flow_rate_gph: null,
    heater_watts: 100,
    light_type: null,
    light_output: null,
    substrate_type: null,
    dimensions: null,
    price_estimate: 30,
    guide_rating: 4,
    difficulty: "beginner",
    is_active: true,
    created_at: "2026-07-17T00:00:00.000Z",
    updated_at: "2026-07-17T00:00:00.000Z",
    ...overrides,
  };
}

function context({
  gallons = 20,
  selectedSpecies = [],
  heaterQuantity = 0,
  heaterProduct,
}: {
  gallons?: number;
  selectedSpecies?: AquariumSpecies[];
  heaterQuantity?: number;
  heaterProduct?: Product | null;
} = {}): AquariumValidatorContext {
  const equipment: AquariumBuild["equipment"] =
    heaterQuantity > 0
      ? [
          {
            productId: "heater-1",
            name: "Test Heater",
            category: "heater",
            quantity: heaterQuantity,
            estimatedPrice: 30,
          },
        ]
      : [];

  return {
    input: {
      tank: {
        sizeGallons: gallons,
        filtrationLevel: "standard",
        plantedLevel: "none",
      },
      livestock: [],
      plants: [],
      equipment,
    },
    species: selectedSpecies.map(livestock),
    speciesPairs: [],
    compatibilityResults: [],
    heaterProduct,
    stockingAnalysis: null,
  };
}

describe("analyzeHeaterRequirement", () => {
  it.each([
    [72, 80, "required"],
    [70, 78, "recommended"],
    [60, 72, "not-normally-required"],
    [64, 78, "optional"],
  ] as const)("classifies %s-%s°F as %s", (minimum, maximum, expected) => {
    expect(analyzeHeaterRequirement([species("a", minimum, maximum)]).requirement)
      .toBe(expected);
  });

  it("uses the shared recommended range and detects conflicts", () => {
    const result = analyzeHeaterRequirement([
      species("a", 60, 68),
      species("b", 72, 80),
    ]);

    expect(result.requirement).toBe("temperature-conflict");
    expect(result.range).toMatchObject({
      sharedMinimum: 72,
      sharedMaximum: 68,
      hasOverlap: false,
    });
  });

  it("returns insufficient data when a selected species is incomplete", () => {
    expect(
      analyzeHeaterRequirement([
        species("a", 72, 80),
        species("b", null, 78),
      ]).requirement,
    ).toBe("insufficient-data");
  });

  it("falls back to the canonical species range when recommended fields are null", () => {
    const result = analyzeHeaterRequirement([
      species("cory", null, null, 72, 79),
      species("molly", null, null, 72, 82),
    ]);

    expect(result.requirement).toBe("required");
    expect(result.range).toMatchObject({
      sharedMinimum: 72,
      sharedMaximum: 79,
      hasOverlap: true,
      missingItems: [],
    });
  });
});

describe("heatingValidator", () => {
  it("requires a heater for warm livestock", async () => {
    const issues = await heatingValidator.validate(
      context({ selectedSpecies: [species("a", 74, 80)] }),
    );

    expect(issues).toContainEqual(
      expect.objectContaining({
        code: AQUARIUM_VALIDATION_CODES.heaterRequiredMissing,
        severity: "error",
      }),
    );
  });

  it("accepts one suitable active heater", async () => {
    await expect(
      heatingValidator.validate(
        context({
          selectedSpecies: [species("a", 74, 80)],
          heaterQuantity: 1,
          heaterProduct: heater(),
        }),
      ),
    ).resolves.toEqual([]);
  });

  it("reports an undersized heater as an error", async () => {
    const issues = await heatingValidator.validate(
      context({
        gallons: 40,
        selectedSpecies: [species("a", 74, 80)],
        heaterQuantity: 1,
        heaterProduct: heater(),
      }),
    );

    expect(issues).toContainEqual(
      expect.objectContaining({
        code: AQUARIUM_VALIDATION_CODES.heaterUndersized,
        severity: "error",
      }),
    );
  });

  it("reports coldwater, inactive, missing-spec, and multiple-heater states", async () => {
    const coldwater = await heatingValidator.validate(
      context({
        selectedSpecies: [species("cold", 60, 68)],
        heaterQuantity: 1,
        heaterProduct: heater({ is_active: false }),
      }),
    );
    const missingSpec = await heatingValidator.validate(
      context({ heaterQuantity: 1, heaterProduct: null }),
    );
    const multiple = await heatingValidator.validate(
      context({ heaterQuantity: 2, heaterProduct: heater() }),
    );

    expect(coldwater.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        AQUARIUM_VALIDATION_CODES.heaterMayBeUnnecessary,
        AQUARIUM_VALIDATION_CODES.heaterInactive,
      ]),
    );
    expect(missingSpec).toContainEqual(
      expect.objectContaining({
        code: AQUARIUM_VALIDATION_CODES.heaterSpecificationMissing,
      }),
    );
    expect(multiple).toContainEqual(
      expect.objectContaining({
        code: AQUARIUM_VALIDATION_CODES.multipleHeatersUnsupported,
        severity: "error",
      }),
    );
  });

  it("does not create false heater errors without livestock", async () => {
    await expect(heatingValidator.validate(context())).resolves.toEqual([]);
  });
});

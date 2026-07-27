import { describe, expect, it } from "vitest";

import type { SpeciesRow } from "../../compatibility/types";
import type { Product } from "../../products/types";
import { createTankSizeGenerationKey } from "../generation/identity";

import { createTankSizeGuideGenerator } from "./generator";
import type { TankSizeGuideData, TankSizeGuideVariation } from "./types";

function species(slug: string, overrides: Partial<SpeciesRow> = {}) {
  return {
    id: slug,
    slug,
    common_name: slug
      .split("-")
      .map((part) => `${part[0].toUpperCase()}${part.slice(1)}`)
      .join(" "),
    scientific_name: slug,
    compatibility_tags: ["community"],
    temperament: "Peaceful",
    aggression_level: 1,
    max_size_inches: 2,
    tank_size_gal: 10,
    min_temp_f: 72,
    max_temp_f: 80,
    min_ph: 6.5,
    max_ph: 7.5,
    min_group_size: 6,
    bioload_rating: 1,
    specialist_setup: false,
    species_only_preferred: false,
    updated_at: "2026-07-01T00:00:00.000Z",
    ...overrides,
  } as SpeciesRow;
}

function product(
  id: string,
  category: Product["category"],
): Product {
  return {
    id,
    slug: id,
    title: id,
    category,
    brand: "Test",
    model: null,
    description: null,
    short_description: null,
    image_url: null,
    recommended_tank_min_gallons: 10,
    recommended_tank_max_gallons: 30,
    freshwater: true,
    saltwater: false,
    planted_tank: false,
    flow_rate_gph: null,
    heater_watts: null,
    light_type: null,
    light_output: null,
    substrate_type: null,
    dimensions: null,
    price_estimate: null,
    guide_rating: null,
    difficulty: null,
    is_active: true,
    created_at: "2026-07-01T00:00:00.000Z",
    updated_at: "2026-07-01T00:00:00.000Z",
  };
}

function data(): TankSizeGuideData {
  const speciesRows = [
    species("ember-tetra"),
    species("honey-gourami", { min_group_size: 1 }),
    species("pygmy-corydoras"),
    species("zebra-danio"),
  ];

  return {
    species: speciesRows,
    guidelines: [
      {
        id: "guideline-one",
        speciesId: speciesRows[0].id,
        gallons: 20,
        scenario: "community",
        notes: "Keep the complete school together.",
      },
    ],
    careGuides: [
      {
        id: "care-ember",
        slug: "ember-tetra",
        title: "Ember Tetra Care Guide",
        speciesSlug: "ember-tetra",
      },
    ],
    products: [
      product("tank", "tanks"),
      product("filter", "filters"),
      product("heater", "heaters"),
    ],
  };
}

async function generate(variation: TankSizeGuideVariation) {
  const generator = createTankSizeGuideGenerator(
    variation,
    async () => data(),
  );
  return generator.generate({
    family: "tank_size",
    guideType: variation,
    generationKey: createTankSizeGenerationKey(
      20,
      variation === "community" ? variation : undefined,
    ),
    input: { gallons: 20, variation },
  });
}

describe("tank-size Guide generator", () => {
  it("generates a general Guide with constraints and Builder links", async () => {
    const result = await generate("general");

    expect(result.title).toBe("Best Fish for 20 Gallon Aquariums");
    expect(result.slug).toBe("best-fish-for-20-gallon-aquariums");
    expect(JSON.stringify(result.sections)).toContain(
      "not a complete or guaranteed-safe stocking plan",
    );
    expect(result.generationMetadata).toMatchObject({
      gallons: 20,
      variation: "general",
      suitabilityCounts: { suitable: 4 },
      internalLinks: expect.arrayContaining([
        expect.objectContaining({ href: "/aquarium-builder" }),
        expect.objectContaining({
          href: "/aquarium-builder/products/filters",
        }),
      ]),
      relatedProducts: expect.arrayContaining([
        expect.objectContaining({ category: "tanks" }),
      ]),
    });
  });

  it("generates the community variation with a distinct identity", async () => {
    const result = await generate("community");

    expect(result.title).toBe("Community Fish for 20 Gallon Tanks");
    expect(result.slug).toBe("20-gallon-community-fish");
    expect(result.primarySearchIntent).toBe(
      "community fish for 20 gallon tank",
    );
  });

  it("rejects a variation mismatch", async () => {
    const generator = createTankSizeGuideGenerator(
      "general",
      async () => data(),
    );

    await expect(
      generator.generate({
        family: "tank_size",
        guideType: "general",
        generationKey: "tank-size:20-gallon",
        input: { gallons: 20, variation: "community" },
      }),
    ).rejects.toThrow("does not match");
  });
});


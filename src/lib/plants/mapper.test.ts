import { describe, expect, it } from "vitest";

import { mapPlantDatabaseRow } from "./mapper";
import type { PlantDatabaseRow } from "./types";

function plantRow(
  overrides: Partial<PlantDatabaseRow> = {},
): PlantDatabaseRow {
  return {
    id: "plant-1",
    slug: "java-fern",
    common_name: "Java Fern",
    scientific_name: "Microsorum pteropus",
    description: "A rhizome plant.",
    care_level: "beginner",
    growth_rate: "slow",
    placement: "epiphyte",
    minimum_tank_gallons: null,
    minimum_temperature_f: null,
    maximum_temperature_f: null,
    minimum_ph: null,
    maximum_ph: null,
    minimum_light_level: "low",
    maximum_light_level: "medium",
    co2_required: false,
    maximum_height_inches: null,
    image_url: null,
    is_active: true,
    created_at: "2026-07-16T00:00:00.000Z",
    updated_at: "2026-07-16T00:00:00.000Z",
    ...overrides,
  };
}

describe("mapPlantDatabaseRow", () => {
  it("maps database snake_case fields into the plant domain model", () => {
    expect(mapPlantDatabaseRow(plantRow())).toEqual({
      id: "plant-1",
      slug: "java-fern",
      commonName: "Java Fern",
      scientificName: "Microsorum pteropus",
      description: "A rhizome plant.",
      careLevel: "beginner",
      growthRate: "slow",
      placement: "epiphyte",
      minimumTankGallons: null,
      minimumTemperatureF: null,
      maximumTemperatureF: null,
      minimumPh: null,
      maximumPh: null,
      minimumLightLevel: "low",
      maximumLightLevel: "medium",
      co2Required: false,
      maximumHeightInches: null,
      imageUrl: null,
      isActive: true,
      createdAt: "2026-07-16T00:00:00.000Z",
      updatedAt: "2026-07-16T00:00:00.000Z",
    });
  });

  it("preserves nullable husbandry fields", () => {
    const plant = mapPlantDatabaseRow(
      plantRow({ growth_rate: null, placement: null }),
    );

    expect(plant.growthRate).toBeNull();
    expect(plant.placement).toBeNull();
  });

  it("rejects controlled values that violate the domain contract", () => {
    expect(() =>
      mapPlantDatabaseRow(plantRow({ care_level: "unknown" })),
    ).toThrow("invalid care level");
  });
});

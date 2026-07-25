import { describe, expect, it } from "vitest";

import type { SpeciesRow } from "../../compatibility/types";
import { getRelatedSpecies } from "./related-species";

function createSpecies(
  id: string,
  overrides: Partial<SpeciesRow> = {},
): SpeciesRow {
  return {
    id,
    slug: id,
    common_name: id,
    scientific_name: id,
    temperament: "Peaceful",
    tank_size_gal: 20,
    min_temp_f: 74,
    max_temp_f: 80,
    recommended_min_temp_f: 74,
    recommended_max_temp_f: 80,
    min_ph: 6,
    max_ph: 7.5,
    min_gh_dgh: 2,
    max_gh_dgh: 10,
    max_size_inches: 2,
    care_level: "Easy",
    compatibility_tags: ["community", "schooling", "mid_water"],
    schooling: true,
    preferred_tank_style: "planted",
    activity_level: "active",
    territory_zone: "mid",
    flow_preference: "moderate",
    hardness_preference: "soft",
    ...overrides,
  } as SpeciesRow;
}

describe("related-species selection", () => {
  it("keeps compatible and incompatible recommendations separate", () => {
    const current = createSpecies("current");
    const compatible = createSpecies("compatible");
    const incompatible = createSpecies("incompatible");
    const groups = getRelatedSpecies(current, [
      {
        species: compatible,
        compatibility: "compatible",
        compatibilityScore: 92,
      },
      {
        species: incompatible,
        compatibility: "incompatible",
        compatibilityScore: 20,
      },
    ]);

    expect(groups.commonTankMates.map((item) => item.species.id)).toEqual([
      "compatible",
    ]);
    expect(groups.speciesToAvoid.map((item) => item.species.id)).toEqual([
      "incompatible",
    ]);
    expect(
      groups.similarSpecies.some(
        (item) => item.species.id === "incompatible",
      ),
    ).toBe(false);
  });

  it("excludes self, duplicate, draft, and archived species", () => {
    const current = createSpecies("current");
    const included = createSpecies("included");
    const groups = getRelatedSpecies(current, [
      { species: current, compatibility: "compatible" },
      { species: included, compatibility: "compatible" },
      { species: included, compatibility: "compatible" },
      {
        species: createSpecies("draft"),
        availability: "draft",
        compatibility: "compatible",
      },
      {
        species: createSpecies("archived"),
        availability: "archived",
        compatibility: "incompatible",
      },
    ]);

    expect(groups.commonTankMates.map((item) => item.species.id)).toEqual([
      "included",
    ]);
    expect(groups.speciesToAvoid).toEqual([]);
  });

  it("applies minimum scores and recommendation limits", () => {
    const current = createSpecies("current");
    const candidates = [
      createSpecies("alpha"),
      createSpecies("beta"),
      createSpecies("gamma"),
    ].map((species) => ({ species }));

    const groups = getRelatedSpecies(current, candidates, {
      limit: 2,
      minimumScore: 90,
    });

    expect(groups.similarSpecies).toHaveLength(2);
    expect(groups.similarCareRequirements).toHaveLength(2);
    expect(
      groups.similarSpecies.every((item) => item.score >= 90),
    ).toBe(true);
  });

  it("sorts explicit compatibility results by score then name", () => {
    const current = createSpecies("current");
    const groups = getRelatedSpecies(current, [
      {
        species: createSpecies("zebra", { common_name: "Zebra" }),
        compatibility: "compatible",
        compatibilityScore: 80,
      },
      {
        species: createSpecies("alpha", { common_name: "Alpha" }),
        compatibility: "compatible",
        compatibilityScore: 90,
      },
    ]);

    expect(groups.commonTankMates.map((item) => item.species.id)).toEqual([
      "alpha",
      "zebra",
    ]);
  });

  it("returns empty groups when the configured limit is zero", () => {
    const groups = getRelatedSpecies(
      createSpecies("current"),
      [{ species: createSpecies("candidate") }],
      { limit: 0 },
    );

    expect(groups).toEqual({
      commonTankMates: [],
      similarSpecies: [],
      similarCareRequirements: [],
      speciesToAvoid: [],
    });
  });
});

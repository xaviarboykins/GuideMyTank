import { describe, expect, it } from "vitest";

import type { SpeciesRow } from "../../compatibility/types";
import {
  scoreCareRequirementSimilarity,
  scoreSpeciesSimilarity,
} from "./scoring";

function createSpecies(
  overrides: Partial<SpeciesRow> = {},
): SpeciesRow {
  return {
    id: "species-1",
    slug: "ember-tetra",
    common_name: "Ember Tetra",
    scientific_name: "Hyphessobrycon amandae",
    temperament: "Peaceful",
    tank_size_gal: 10,
    min_temp_f: 73,
    max_temp_f: 82,
    recommended_min_temp_f: 75,
    recommended_max_temp_f: 80,
    min_ph: 5.5,
    max_ph: 7.5,
    min_gh_dgh: 1,
    max_gh_dgh: 10,
    min_kh_dkh: 0,
    max_kh_dkh: 6,
    max_size_inches: 1,
    care_level: "Easy",
    compatibility_tags: [
      "community",
      "schooling",
      "nano_tank",
      "mid_water",
    ],
    schooling: true,
    min_group_size: 6,
    preferred_tank_style: "planted",
    activity_level: "active",
    territory_zone: "mid",
    flow_preference: "moderate",
    hardness_preference: "soft",
    ...overrides,
  } as SpeciesRow;
}

describe("related-species scoring", () => {
  it("gives fully aligned profiles the maximum score", () => {
    const current = createSpecies();
    const candidate = createSpecies({
      id: "species-2",
      slug: "neon-tetra",
      common_name: "Neon Tetra",
    });

    expect(scoreSpeciesSimilarity(current, candidate)?.score).toBe(100);
    expect(scoreCareRequirementSimilarity(current, candidate)?.score).toBe(
      100,
    );
  });

  it("scores partially aligned profiles below close matches", () => {
    const current = createSpecies();
    const closeMatch = createSpecies({
      id: "species-2",
      slug: "neon-tetra",
    });
    const distantMatch = createSpecies({
      id: "species-3",
      slug: "oscar",
      temperament: "Aggressive",
      tank_size_gal: 75,
      min_temp_f: 70,
      max_temp_f: 72,
      recommended_min_temp_f: 70,
      recommended_max_temp_f: 72,
      min_ph: 7.6,
      max_ph: 8.2,
      min_gh_dgh: 12,
      max_gh_dgh: 20,
      max_size_inches: 14,
      care_level: "Intermediate",
      compatibility_tags: ["large_tank", "aggressive", "territorial"],
      schooling: false,
      preferred_tank_style: "rockwork",
      activity_level: "boisterous",
      territory_zone: "all",
      flow_preference: "high",
      hardness_preference: "hard",
    });

    expect(scoreSpeciesSimilarity(closeMatch, current)!.score).toBeGreaterThan(
      scoreSpeciesSimilarity(current, distantMatch)!.score,
    );
  });

  it("rejects profiles with insufficient comparable data", () => {
    const sparse = createSpecies({
      id: "sparse",
      temperament: null,
      tank_size_gal: null,
      min_temp_f: null,
      max_temp_f: null,
      recommended_min_temp_f: null,
      recommended_max_temp_f: null,
      min_ph: null,
      max_ph: null,
      min_gh_dgh: null,
      max_gh_dgh: null,
      max_size_inches: null,
      care_level: null,
      compatibility_tags: [],
      schooling: null,
      preferred_tank_style: null,
      activity_level: null,
      territory_zone: null,
      flow_preference: null,
      hardness_preference: null,
    });

    expect(scoreSpeciesSimilarity(createSpecies(), sparse)).toBeNull();
    expect(
      scoreCareRequirementSimilarity(createSpecies(), sparse),
    ).toBeNull();
  });
});

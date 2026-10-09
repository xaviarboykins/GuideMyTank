import { describe, expect, it } from "vitest";

import { buildCompatibilityPairAnalysis } from "./analysis";
import { calculateCompatibilityDiagnostics } from "./engine";
import type { SpeciesRow } from "./types";

function species(name: string, overrides: Partial<SpeciesRow> = {}) {
  return {
    id: name.toLowerCase().replaceAll(" ", "-"),
    slug: name.toLowerCase().replaceAll(" ", "-"),
    common_name: name,
    scientific_name: `${name} scientificus`,
    compatibility_tags: ["community"],
    temperament: "Peaceful",
    aggression_level: 1,
    activity_level: "Moderate",
    territory_zone: "midwater",
    flow_preference: "Moderate",
    diet: "Omnivore",
    care_level: "Beginner",
    preferred_tank_style: "Planted community",
    min_group_size: 6,
    max_size_inches: 2,
    tank_size_gal: 20,
    min_temp_f: 74,
    max_temp_f: 80,
    min_ph: 6,
    max_ph: 7.5,
    updated_at: "2026-09-20T00:00:00.000Z",
    ...overrides,
  } as SpeciesRow;
}

function analyze(speciesA: SpeciesRow, speciesB: SpeciesRow) {
  const diagnostics = calculateCompatibilityDiagnostics(speciesA, speciesB);
  return buildCompatibilityPairAnalysis(
    speciesA,
    speciesB,
    diagnostics.result,
    diagnostics.findings,
  );
}

describe("compatibility pair analysis", () => {
  it("uses exact pair-specific water overlap and space requirements", () => {
    const analysis = analyze(
      species("Cardinal Tetra", {
        min_temp_f: 75,
        max_temp_f: 82,
        min_ph: 4.5,
        max_ph: 7,
        tank_size_gal: 20,
      }),
      species("Kuhli Loach", {
        min_temp_f: 73,
        max_temp_f: 80,
        min_ph: 5.5,
        max_ph: 7.5,
        tank_size_gal: 30,
      }),
    );

    expect(analysis.water).toContain("75–80°F");
    expect(analysis.water).toContain("5.5–7");
    expect(analysis.space).toContain("Kuhli Loach");
    expect(analysis.space).toContain("30 gallons");
  });

  it("produces materially different output for different species profiles", () => {
    const community = analyze(
      species("Ember Tetra"),
      species("Pygmy Cory", { territory_zone: "bottom" }),
    );
    const territorial = analyze(
      species("Betta", {
        temperament: "Semi-aggressive",
        aggression_level: 6,
        min_group_size: 1,
        flow_preference: "Low",
        territory_zone: "surface",
        tank_size_gal: 5,
      }),
      species("Tiger Barb", {
        temperament: "Semi-aggressive",
        aggression_level: 5,
        activity_level: "High",
        tank_size_gal: 30,
      }),
    );

    expect(community.overview).not.toBe(territorial.overview);
    expect(community.behavior).not.toBe(territorial.behavior);
    expect(community.space).not.toBe(territorial.space);
    expect(territorial.behavior).toContain("surface");
    expect(territorial.behavior).toContain("group of at least 6");
  });

  it("discloses incomplete data instead of inventing a shared range", () => {
    const analysis = analyze(
      species("Unknown Fish", {
        min_temp_f: null,
        max_temp_f: null,
        min_ph: null,
        max_ph: null,
      }),
      species("Known Fish"),
    );

    expect(analysis.water).toContain("not fully recorded");
    expect(analysis.water).toContain("no complete overlap in the recorded ranges");
    expect(analysis.checklist[0]).toContain(
      "no complete overlap in the recorded ranges",
    );
  });

  it("recommends separation when the engine returns a blocking verdict", () => {
    const analysis = analyze(
      species("Warm Fish", { min_temp_f: 80, max_temp_f: 84 }),
      species("Cool Fish", { min_temp_f: 60, max_temp_f: 68 }),
    );

    expect(analysis.checklist.at(-1)).toContain("separate aquariums");
    expect(analysis.decisionGuide.at(-1)).toContain("different tank mate");
  });

  it("turns pair-specific findings into practical decision boundaries", () => {
    const analysis = analyze(
      species("Territorial Fish", {
        temperament: "Aggressive",
        aggression_level: 9,
        territory_zone: "bottom",
      }),
      species("Peaceful Bottom Fish", { territory_zone: "bottom" }),
    );

    expect(analysis.decisionGuide.join(" ")).toMatch(
      /sight lines|adult group sizes|stop conditions/,
    );
    expect(analysis.decisionGuide.at(-1)).toMatch(
      /different tank mate|separation option/,
    );
  });
});

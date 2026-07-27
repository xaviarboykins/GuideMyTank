import { describe, expect, it } from "vitest";

import type {
  CompatibilityResult,
  SpeciesRow,
} from "../../compatibility/types";
import { buildSpeciesPageLinks } from "./species-page-links";

function species(id: string, overrides: Partial<SpeciesRow> = {}) {
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

function compatibility(
  current: SpeciesRow,
  candidate: SpeciesRow,
  classification: CompatibilityResult["compatibility"],
  score: number,
): CompatibilityResult {
  return {
    score,
    status: classification === "compatible" ? "Compatible" : "Incompatible",
    reasons: [`${classification} result.`],
    compatibility: classification,
    confidence: 0.9,
    notes: null,
    expertValidated: false,
    species_a: {
      slug: current.slug,
      common_name: current.common_name,
    },
    species_b: {
      slug: candidate.slug,
      common_name: candidate.common_name,
    },
  };
}

describe("species page internal links", () => {
  it("does not promote compatibility classifications outside the accordion", () => {
    const current = species("current");
    const compatible = species("compatible");
    const incompatible = species("incompatible");
    const links = buildSpeciesPageLinks({
      currentSpecies: current,
      candidates: [compatible, incompatible],
      compatibility: {
        compatible: [
          compatibility(current, compatible, "compatible", 90),
        ],
        caution: [],
        incompatible: [
          compatibility(current, incompatible, "incompatible", 20),
        ],
      },
    });

    expect(links.remainingCompatibility.compatible).toHaveLength(1);
    expect(links.remainingCompatibility.incompatible).toHaveLength(1);
  });

  it("preserves the complete compatibility groups", () => {
    const current = species("current");
    const compatible = species("compatible");
    const incompatible = species("incompatible");
    const links = buildSpeciesPageLinks({
      currentSpecies: current,
      candidates: [compatible, incompatible],
      compatibility: {
        compatible: [
          compatibility(current, compatible, "compatible", 90),
        ],
        caution: [],
        incompatible: [
          compatibility(current, incompatible, "incompatible", 20),
        ],
      },
    });

    expect(links.remainingCompatibility.compatible).toHaveLength(1);
    expect(links.remainingCompatibility.incompatible).toHaveLength(1);
  });

  it("returns a limited similar-species section", () => {
    const current = species("current");
    const candidate = species("similar");
    const links = buildSpeciesPageLinks({
      currentSpecies: current,
      candidates: [candidate],
      compatibility: {
        compatible: [],
        caution: [],
        incompatible: [],
      },
    });
    expect(links.similarSpecies.map((item) => item.href)).toEqual([
      "/species/similar",
    ]);
  });

  it("adds the configured cluster hub Article without a duplicate hub link", () => {
    const current = species("betta-id", {
      slug: "betta-splendens",
      common_name: "Betta",
    });
    const links = buildSpeciesPageLinks({
      currentSpecies: current,
      candidates: [],
      compatibility: {
        compatible: [],
        caution: [],
        incompatible: [],
      },
      articles: [
        {
          id: "article-id",
          slug: "most-popular-freshwater-aquarium-fish-2026",
          title: "Popular Freshwater Fish",
          summary: "Popular species overview.",
        },
        {
          id: "guide-id",
          slug: "betta-splendens-vs-guppy",
          title: "Betta vs Guppy",
          summary: "Compare their aquarium requirements.",
          content_type: "guide",
        },
      ],
    });

    expect(links.articles.map((item) => item.href)).toEqual(
      expect.arrayContaining([
        "/learning-center/most-popular-freshwater-aquarium-fish-2026",
        "/learning-center/guides/betta-splendens-vs-guppy",
      ]),
    );
    expect(links.topicClusters).toEqual([]);
    expect(links.builder[0].href).toBe("/aquarium-builder");
  });
});

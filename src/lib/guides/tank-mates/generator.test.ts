import { describe, expect, it } from "vitest";

import type {
  CompatibilityResult,
  SpeciesRow,
} from "../../compatibility/types";
import { createTankMateGenerationKey } from "../generation/identity";

import { createTankMateGuideGenerator } from "./generator";
import type { TankMateGuideData, TankMateGuideVariant } from "./types";

function species(
  id: string,
  name: string,
  values: Partial<SpeciesRow> = {},
) {
  return {
    id,
    slug: id,
    common_name: name,
    scientific_name: `${name} scientific`,
    temperament: "Peaceful",
    tank_size_gal: 20,
    min_group_size: 1,
    preferred_tank_style: "community",
    updated_at: "2026-07-01T00:00:00.000Z",
    ...values,
  } as SpeciesRow;
}

function compatibility(
  target: SpeciesRow,
  candidate: SpeciesRow,
  classification: CompatibilityResult["compatibility"],
  confidence: number,
): CompatibilityResult {
  return {
    score: classification === "compatible" ? 80 : 45,
    status: classification === "compatible" ? "Compatible" : "Caution",
    reasons: [`Structured reason for ${candidate.common_name}.`],
    compatibility: classification,
    confidence,
    notes: null,
    expertValidated: false,
    species_a: {
      slug: target.slug,
      common_name: target.common_name,
    },
    species_b: {
      slug: candidate.slug,
      common_name: candidate.common_name,
    },
  };
}

function guideData(): TankMateGuideData {
  const target = species("betta-splendens", "Betta");
  const compatible = species("ember-tetra", "Ember Tetra");
  const conditional = species("corydoras", "Corydoras");
  const avoid = species("tiger-barb", "Tiger Barb");
  const lowConfidence = species("mystery-fish", "Mystery Fish");

  return {
    targetSpecies: target,
    candidates: [compatible, conditional, avoid, lowConfidence],
    compatibilityResults: [
      compatibility(target, compatible, "compatible", 0.9),
      compatibility(target, conditional, "caution", 0.85),
      compatibility(target, avoid, "incompatible", 0.95),
      compatibility(target, lowConfidence, "compatible", 0.5),
    ],
    careGuides: [
      {
        id: "care-ember",
        slug: "ember-tetra",
        title: "Ember Tetra Care Guide",
        speciesSlug: compatible.slug,
      },
    ],
    sourceReferences: [
      {
        id: "source-betta",
        sourceUrl: "https://example.org/betta",
        sourceLabel: "Betta source",
        sourceCategory: "compatibility",
        confidence: "high",
        updatedAt: "2026-07-02T00:00:00.000Z",
      },
    ],
  };
}

async function generate(variant: TankMateGuideVariant) {
  const data = guideData();
  const generator = createTankMateGuideGenerator(variant, async () => data);
  return generator.generate({
    family: "tank_mates",
    guideType: variant,
    generationKey: createTankMateGenerationKey(
      data.targetSpecies.slug,
      variant,
    ),
    input: { speciesSlug: data.targetSpecies.slug, variant },
  });
}

describe("tank-mate Guide generator", () => {
  it("generates recommended, conditional, and avoid sections", async () => {
    const result = await generate("tank-mates");

    expect(result.title).toBe("Best Tank Mates for Betta");
    expect(result.slug).toBe("best-tank-mates-for-betta-splendens");
    expect(result.generationMetadata).toMatchObject({
      confidenceThreshold: 0.75,
      recommendationCounts: {
        recommended: 1,
        conditional: 1,
        avoid: 1,
        excludedLowConfidence: 1,
      },
    });
    expect(JSON.stringify(result.sections)).not.toContain("Mystery Fish");
    expect(result.generationMetadata).toMatchObject({
      internalLinks: expect.arrayContaining([
        expect.objectContaining({
          href: "/compatibility/betta-splendens/ember-tetra",
        }),
      ]),
    });
  });

  it("prioritizes avoid content for the avoid-with variant", async () => {
    const result = await generate("avoid-with");
    const headings = result.sections
      .filter((section) => section.blockType === "heading")
      .map((section) => JSON.stringify(section.content));

    expect(result.title).toBe("Fish to Avoid with Betta");
    expect(result.slug).toBe("fish-to-avoid-with-betta-splendens");
    expect(headings[1]).toContain("Species to avoid");
  });

  it("rejects a generator/request variant mismatch", async () => {
    const data = guideData();
    const generator = createTankMateGuideGenerator(
      "tank-mates",
      async () => data,
    );

    await expect(
      generator.generate({
        family: "tank_mates",
        guideType: "tank-mates",
        generationKey: createTankMateGenerationKey(
          data.targetSpecies.slug,
        ),
        input: {
          speciesSlug: data.targetSpecies.slug,
          variant: "avoid-with",
        },
      }),
    ).rejects.toThrow("does not match");
  });
});


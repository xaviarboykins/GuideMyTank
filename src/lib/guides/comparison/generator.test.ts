import { describe, expect, it } from "vitest";

import type { SpeciesRow } from "../../compatibility/types";
import { createComparisonGenerationKey } from "../generation/identity";

import { createSpeciesComparisonGenerator } from "./generator";
import type { ComparisonGuideData } from "./types";

function species(
  values: Partial<SpeciesRow> &
    Pick<SpeciesRow, "id" | "slug" | "common_name" | "scientific_name">,
) {
  return {
    tank_size_gal: 10,
    min_temp_f: 75,
    max_temp_f: 80,
    min_ph: 6.5,
    max_ph: 7.5,
    max_size_inches: 3,
    temperament: "Peaceful",
    care_level: "Easy",
    min_group_size: 1,
    updated_at: "2026-07-01T00:00:00.000Z",
    ...values,
  } as SpeciesRow;
}

function comparisonData(): ComparisonGuideData {
  const speciesA = species({
    id: "species-a",
    slug: "betta-splendens",
    common_name: "Betta",
    scientific_name: "Betta splendens",
  });
  const speciesB = species({
    id: "species-b",
    slug: "honey-gourami",
    common_name: "Honey Gourami",
    scientific_name: "Trichogaster chuna",
    tank_size_gal: 20,
    min_group_size: 2,
  });

  return {
    speciesA,
    speciesB,
    compatibility: {
      score: 58,
      status: "Caution",
      reasons: ["Both species may defend similar areas of the aquarium."],
      compatibility: "caution",
      confidence: 0.88,
      notes: "Review the complete setup.",
      expertValidated: false,
      species_a: {
        slug: speciesA.slug,
        common_name: speciesA.common_name,
      },
      species_b: {
        slug: speciesB.slug,
        common_name: speciesB.common_name,
      },
    },
    careGuides: [
      {
        id: "care-a",
        slug: "betta",
        title: "Betta Care Guide",
        speciesSlug: speciesA.slug,
      },
    ],
    sourceReferences: [
      {
        id: "source-a",
        speciesId: speciesA.id,
        sourceUrl: "https://example.org/betta",
        sourceLabel: "Betta reference",
        sourceCategory: "care",
        confidence: "high",
        updatedAt: "2026-07-01T00:00:00.000Z",
      },
    ],
  };
}

describe("Species comparison generator", () => {
  it("creates deterministic structured comparison content and links", async () => {
    const data = comparisonData();
    const generator = createSpeciesComparisonGenerator(async () => data);
    const generationKey = createComparisonGenerationKey(
      data.speciesA.slug,
      data.speciesB.slug,
    );
    const result = await generator.generate({
      family: "species_comparison",
      guideType: "comparison",
      generationKey,
      input: {
        speciesASlug: data.speciesA.slug,
        speciesBSlug: data.speciesB.slug,
      },
    });

    expect(result.title).toBe("Betta vs Honey Gourami");
    expect(result.slug).toBe("betta-splendens-vs-honey-gourami");
    expect(result.sections.map((section) => section.blockType)).toEqual(
      expect.arrayContaining([
        "comparison_table",
        "warning",
        "faq_group",
      ]),
    );
    expect(result.sourceEntities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          entityType: "species_source_reference",
          entityKey: "source-a",
        }),
      ]),
    );
    expect(result.generationMetadata).toMatchObject({
      speciesIds: ["species-a", "species-b"],
      compatibility: { classification: "caution", confidence: 0.88 },
      internalLinks: expect.arrayContaining([
        expect.objectContaining({
          href: "/compatibility/betta-splendens/honey-gourami",
        }),
      ]),
    });
  });

  it("rejects a mismatched generation key", async () => {
    const data = comparisonData();
    const generator = createSpeciesComparisonGenerator(async () => data);

    await expect(
      generator.generate({
        family: "species_comparison",
        guideType: "comparison",
        generationKey: "comparison:wrong-pair",
        input: {
          speciesASlug: data.speciesA.slug,
          speciesBSlug: data.speciesB.slug,
        },
      }),
    ).rejects.toThrow("does not match");
  });

  it("loads reversed input in canonical order", async () => {
    const data = comparisonData();
    let receivedInput:
      | { speciesASlug: string; speciesBSlug: string }
      | undefined;
    const generator = createSpeciesComparisonGenerator(async (input) => {
      receivedInput = input;
      return data;
    });

    await generator.generate({
      family: "species_comparison",
      guideType: "comparison",
      generationKey: createComparisonGenerationKey(
        data.speciesB.slug,
        data.speciesA.slug,
      ),
      input: {
        speciesASlug: data.speciesB.slug,
        speciesBSlug: data.speciesA.slug,
      },
    });

    expect(receivedInput).toEqual({
      speciesASlug: "betta-splendens",
      speciesBSlug: "honey-gourami",
    });
  });
});

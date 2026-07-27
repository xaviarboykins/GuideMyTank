import { calculateCompatibility } from "../../compatibility/engine";
import { ContentServiceError } from "../../content/errors";
import { resolveInternalLinkPath } from "../../seo/internal-linking/route-resolver";
import type { Json } from "../../../types/database.types";
import { createTankSizeGenerationKey } from "../generation/identity";
import type { GuideGenerator } from "../generation/types";

import { evaluateTankSizeSuitability } from "./policy";
import type {
  TankSizeGuideData,
  TankSizeGuideInput,
  TankSizeGuideVariation,
} from "./types";
import { validateTankSizeGuideData } from "./validation";

type TankSizeDataLoader = (
  input: TankSizeGuideInput,
) => Promise<TankSizeGuideData>;

async function loadDefaultTankSizeData(input: TankSizeGuideInput) {
  const { loadTankSizeGuideData } = await import("./loader");
  return loadTankSizeGuideData(input);
}

function internalLinks(
  data: TankSizeGuideData,
  suitableSlugs: string[],
) {
  const careGuideBySpecies = new Map(
    data.careGuides.map((guide) => [guide.speciesSlug, guide]),
  );
  const targets = [
    {
      type: "builder",
      title: "Aquarium Builder",
      href: resolveInternalLinkPath({ entityType: "builder" }),
    },
    ...(["tanks", "filters", "heaters"] as const).map((category) => ({
      type: "product-category",
      title: `${category[0].toUpperCase()}${category.slice(1)}`,
      href: resolveInternalLinkPath({
        entityType: "product-category",
        category,
      }),
    })),
    ...suitableSlugs.flatMap((slug) => {
      const species = data.species.find((candidate) => candidate.slug === slug);
      if (!species) return [];
      const careGuide = careGuideBySpecies.get(slug);
      return [
        {
          type: "species",
          title: species.common_name,
          href: resolveInternalLinkPath({
            entityType: "species" as const,
            slug,
          }),
        },
        ...(careGuide?.slug
          ? [
              {
                type: "care-guide",
                title: careGuide.title ?? "Care Guide",
                href: resolveInternalLinkPath({
                  entityType: "care-guide" as const,
                  slug: careGuide.slug,
                }),
              },
            ]
          : []),
      ];
    }),
  ];

  return targets.filter(
    (target): target is typeof target & { href: string } =>
      typeof target.href === "string",
  );
}

function compatibilitySnapshot(
  suitable: TankSizeGuideData["species"],
) {
  const candidates = suitable.slice(0, 12);
  const results = [];

  for (let indexA = 0; indexA < candidates.length; indexA += 1) {
    for (let indexB = indexA + 1; indexB < candidates.length; indexB += 1) {
      results.push(
        calculateCompatibility(candidates[indexA], candidates[indexB]),
      );
    }
  }

  return {
    evaluatedSpeciesCount: candidates.length,
    evaluatedPairCount: results.length,
    compatibleCount: results.filter(
      (result) => result.compatibility === "compatible",
    ).length,
    cautionCount: results.filter(
      (result) => result.compatibility === "caution",
    ).length,
    incompatibleCount: results.filter(
      (result) => result.compatibility === "incompatible",
    ).length,
    results,
  };
}

function productMatches(data: TankSizeGuideData) {
  return (["tanks", "filters", "heaters"] as const).map((category) => ({
    category,
    products: data.products
      .filter((product) => product.category === category)
      .sort((a, b) => a.title.localeCompare(b.title))
      .slice(0, 5)
      .map((product) => ({
        id: product.id,
        slug: product.slug,
        title: product.title,
        minimumGallons: product.recommended_tank_min_gallons,
        maximumGallons: product.recommended_tank_max_gallons,
        updatedAt: product.updated_at,
      })),
  }));
}

export function createTankSizeGuideGenerator(
  variation: TankSizeGuideVariation,
  loader: TankSizeDataLoader = loadDefaultTankSizeData,
): GuideGenerator<TankSizeGuideInput> {
  return {
    family: "tank_size",
    guideType: variation,
    async generate(request) {
      if (request.input.variation !== variation) {
        throw new ContentServiceError(
          "The requested tank-size variation does not match the generator.",
          "validation",
        );
      }

      const expectedKey = createTankSizeGenerationKey(
        request.input.gallons,
        variation === "community" ? variation : undefined,
      );
      if (request.generationKey !== expectedKey) {
        throw new ContentServiceError(
          "The tank-size generation key does not match the selected volume and variation.",
          "validation",
        );
      }

      const data = await loader(request.input);
      const validation = validateTankSizeGuideData(data, request.input);
      if (!validation.valid) {
        throw new ContentServiceError(
          validation.issues.map((issue) => issue.message).join(" "),
          "validation",
        );
      }

      const suitability = evaluateTankSizeSuitability(data, request.input);
      const selectedSpecies = suitability.suitable;
      const compatibility = compatibilitySnapshot(selectedSpecies);
      const products = productMatches(data);
      const isCommunity = variation === "community";
      const title = isCommunity
        ? `Community Fish for ${request.input.gallons} Gallon Tanks`
        : `Best Fish for ${request.input.gallons} Gallon Aquariums`;
      const applicableGuidelines = data.guidelines.filter((guideline) =>
        selectedSpecies.some(
          (species) => species.id === guideline.speciesId,
        ),
      );

      return {
        title,
        slug: isCommunity
          ? `${request.input.gallons}-gallon-community-fish`
          : `best-fish-for-${request.input.gallons}-gallon-aquariums`,
        summary: `Explore fish whose listed minimum tank size and stocking profile support planning for a ${request.input.gallons}-gallon freshwater aquarium. Every complete stocking plan still requires compatibility and capacity validation.`,
        seoTitle: title,
        metaDescription: `Explore fish for a ${request.input.gallons}-gallon aquarium, including minimum tank sizes, group requirements, stocking constraints, compatibility considerations, and equipment resources.`,
        primarySearchIntent: isCommunity
          ? `community fish for ${request.input.gallons} gallon tank`
          : `best fish for ${request.input.gallons} gallon aquarium`,
        sections: [
          {
            blockType: "paragraph",
            content: {
              text: `This Guide identifies species whose listed minimum tank size does not exceed ${request.input.gallons} gallons and whose stocking profile is complete. That is a starting filter, not a complete or guaranteed-safe stocking plan.`,
            },
          },
          {
            blockType: "heading",
            content: {
              text: `Suitable species for a ${request.input.gallons}-gallon aquarium`,
              level: 2,
            },
          },
          {
            blockType: "comparison_table",
            content: {
              headers: [
                "Species",
                "Listed minimum tank",
                "Minimum group size",
                "Temperament",
                "Care level",
              ],
              rows: selectedSpecies.map((species) => [
                species.common_name,
                `${species.tank_size_gal} gallons`,
                species.min_group_size == null
                  ? "Not available"
                  : String(species.min_group_size),
                species.temperament ?? "Not available",
                species.care_level ?? "Not available",
              ]),
            },
          },
          {
            blockType: "heading",
            content: { text: "Group-size and stocking considerations", level: 2 },
          },
          {
            blockType: "list",
            content: {
              items: [
                `${selectedSpecies.filter((species) => (species.min_group_size ?? 1) > 1).length} listed species require groups larger than one animal.`,
                "A species fitting the tank individually does not mean its full group fits alongside other livestock.",
                "Bioload, filtration, swimming space, territory, and water-parameter overlap must be evaluated together.",
                "Use the Aquarium Builder to validate quantities and the complete livestock plan.",
              ],
            },
          },
          {
            blockType: "heading",
            content: { text: "Compatibility considerations", level: 2 },
          },
          {
            blockType: "paragraph",
            content: {
              text: `A screening pass across the first ${compatibility.evaluatedSpeciesCount} alphabetically listed candidates evaluated ${compatibility.evaluatedPairCount} pairs: ${compatibility.compatibleCount} compatible, ${compatibility.cautionCount} caution, and ${compatibility.incompatibleCount} incompatible. These counts demonstrate why tank volume alone cannot determine a stocking plan.`,
            },
          },
          {
            blockType: "heading",
            content: { text: "Example planning directions", level: 2 },
          },
          {
            blockType: "list",
            content: {
              items: [
                "Start with one species and its complete social or schooling requirement before adding another role.",
                "Check territory zones and swimming space before combining bottom, midwater, or surface-oriented species.",
                "Run every proposed quantity and pair through the Aquarium Builder instead of copying a fixed stocking list.",
              ],
            },
          },
          ...(applicableGuidelines.length
            ? [
                {
                  blockType: "heading" as const,
                  content: { text: "Structured tank-size notes", level: 2 },
                },
                {
                  blockType: "list" as const,
                  content: {
                    items: applicableGuidelines.map((guideline) => {
                      const species = selectedSpecies.find(
                        (candidate) => candidate.id === guideline.speciesId,
                      );
                      return `${species?.common_name ?? "Species"} — ${guideline.scenario}: ${guideline.notes ?? `${guideline.gallons}-gallon guideline`}`;
                    }),
                  },
                },
              ]
            : []),
          {
            blockType: "heading",
            content: { text: "Equipment planning", level: 2 },
          },
          {
            blockType: "paragraph",
            content: {
              text: "The related tank, filter, and heater resources are catalog matches whose configured tank range includes this volume. They are not automatic product endorsements or guarantees of suitability for a specific build.",
            },
          },
          {
            blockType: "warning",
            content: {
              text: "Do not treat this Guide as a guaranteed-safe stocking list. Aquarium dimensions, mature size, minimum groups, behavior, water parameters, filtration, and total bioload can make an apparently suitable combination unsafe.",
            },
          },
          {
            blockType: "faq_group",
            content: {
              items: [
                {
                  question: `How many fish can live in a ${request.input.gallons}-gallon aquarium?`,
                  answer:
                    "There is no reliable fish-per-gallon answer. Quantities depend on species-specific bioload, adult size, social requirements, filtration, territory, and the complete stocking plan.",
                },
                {
                  question: "Does meeting a minimum tank size make two species compatible?",
                  answer:
                    "No. Minimum tank size and pair compatibility are separate constraints, and both must be evaluated alongside the rest of the aquarium.",
                },
                {
                  question: "How should I validate a stocking idea?",
                  answer:
                    "Enter the actual tank, filtration, species, and quantities in the Aquarium Builder and review every compatibility and stocking warning.",
                },
              ],
            },
          },
        ],
        sourceEntities: [
          ...selectedSpecies.map((species) => ({
            entityType: "species",
            entityKey: species.slug,
            contributionRole: "tank_size_candidate",
            sourceUpdatedAt: species.updated_at,
            sourceFingerprint: `${species.tank_size_gal}:${species.min_group_size}:${species.bioload_rating}`,
          })),
          ...applicableGuidelines.map((guideline) => ({
            entityType: "tank_size_guideline",
            entityKey: guideline.id,
            contributionRole: guideline.scenario,
            sourceFingerprint: `${guideline.gallons}:${guideline.notes ?? ""}`,
          })),
          ...data.products.map((product) => ({
            entityType: "product",
            entityKey: product.id,
            contributionRole: product.category,
            sourceUpdatedAt: product.updated_at,
            sourceFingerprint: `${product.recommended_tank_min_gallons}:${product.recommended_tank_max_gallons}:${product.is_active}`,
          })),
          ...compatibility.results.map((result) => ({
            entityType: "compatibility_result",
            entityKey: `${result.species_a.slug}:${result.species_b.slug}`,
            contributionRole: "tank_size_screening",
            sourceFingerprint: JSON.stringify({
              classification: result.compatibility,
              confidence: result.confidence,
              reasons: result.reasons,
            }),
          })),
        ],
        generationMetadata: {
          gallons: request.input.gallons,
          variation,
          suitabilityCounts: {
            suitable: suitability.suitable.length,
            excludedMissingStockingProfile:
              suitability.excludedMissingStockingProfile.length,
            excludedSpecialist: suitability.excludedSpecialist.length,
            excludedByVariation: suitability.excludedByVariation.length,
          },
          compatibilityScreening: {
            evaluatedSpeciesCount: compatibility.evaluatedSpeciesCount,
            evaluatedPairCount: compatibility.evaluatedPairCount,
            compatibleCount: compatibility.compatibleCount,
            cautionCount: compatibility.cautionCount,
            incompatibleCount: compatibility.incompatibleCount,
          },
          internalLinks: internalLinks(
            data,
            selectedSpecies.slice(0, 12).map((species) => species.slug),
          ),
          relatedProducts: products,
        } satisfies Json,
      };
    },
  };
}


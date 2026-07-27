import { ContentServiceError } from "../../content/errors";
import { normalizeContentSlug } from "../../content/slug";
import { resolveInternalLinkPath } from "../../seo/internal-linking/route-resolver";
import type { Json } from "../../../types/database.types";
import type { GuideGenerator } from "../generation/types";
import { createComparisonGenerationKey } from "../generation/identity";

import type {
  ComparisonGuideData,
  ComparisonGuideInput,
} from "./types";
import { validateComparisonGuideData } from "./validation";

type ComparisonDataLoader = (
  input: ComparisonGuideInput,
) => Promise<ComparisonGuideData>;

async function loadDefaultComparisonData(input: ComparisonGuideInput) {
  const { loadComparisonGuideData } = await import("./loader");
  return loadComparisonGuideData(input);
}

function value(value: string | number | null, fallback = "Not available") {
  return value == null || value === "" ? fallback : String(value);
}

function range(
  minimum: number | null,
  maximum: number | null,
  unit = "",
) {
  if (minimum == null || maximum == null) return "Not available";
  return `${minimum}${unit}–${maximum}${unit}`;
}

function choiceGuidance(data: ComparisonGuideData) {
  const choices: string[] = [];
  const { speciesA, speciesB } = data;

  if (
    speciesA.tank_size_gal != null &&
    speciesB.tank_size_gal != null &&
    speciesA.tank_size_gal !== speciesB.tank_size_gal
  ) {
    const smaller =
      speciesA.tank_size_gal < speciesB.tank_size_gal ? speciesA : speciesB;
    choices.push(
      `${smaller.common_name} has the lower listed minimum tank size at ${smaller.tank_size_gal} gallons.`,
    );
  }

  if (speciesA.care_level && speciesB.care_level) {
    choices.push(
      `${speciesA.common_name} is listed as ${speciesA.care_level} care, while ${speciesB.common_name} is listed as ${speciesB.care_level} care.`,
    );
  }

  if (speciesA.min_group_size != null || speciesB.min_group_size != null) {
    choices.push(
      `${speciesA.common_name} has a listed minimum group size of ${value(speciesA.min_group_size)}, compared with ${value(speciesB.min_group_size)} for ${speciesB.common_name}.`,
    );
  }

  return choices.length
    ? choices
    : [
        "Compare the structured requirements below and validate the complete stocking plan in the Aquarium Builder.",
      ];
}

function internalLinks(data: ComparisonGuideData) {
  const targets = [
    {
      type: "species",
      title: data.speciesA.common_name,
      href: resolveInternalLinkPath({
        entityType: "species",
        slug: data.speciesA.slug,
      }),
    },
    {
      type: "species",
      title: data.speciesB.common_name,
      href: resolveInternalLinkPath({
        entityType: "species",
        slug: data.speciesB.slug,
      }),
    },
    {
      type: "compatibility-report",
      title: `${data.speciesA.common_name} and ${data.speciesB.common_name} compatibility report`,
      href: resolveInternalLinkPath({
        entityType: "compatibility-report",
        speciesASlug: data.speciesA.slug,
        speciesBSlug: data.speciesB.slug,
      }),
    },
    {
      type: "builder",
      title: "Aquarium Builder",
      href: resolveInternalLinkPath({ entityType: "builder" }),
    },
    ...data.careGuides.map((guide) => ({
      type: "care-guide",
      title: guide.title ?? "Care Guide",
      href: guide.slug
        ? resolveInternalLinkPath({
            entityType: "care-guide" as const,
            slug: guide.slug,
          })
        : null,
    })),
  ];

  return targets.filter(
    (target): target is typeof target & { href: string } =>
      typeof target.href === "string",
  );
}

export function createSpeciesComparisonGenerator(
  loader: ComparisonDataLoader = loadDefaultComparisonData,
): GuideGenerator<ComparisonGuideInput> {
  return {
    family: "species_comparison",
    guideType: "comparison",
    async generate(request) {
      const canonicalSpeciesSlugs = [
        normalizeContentSlug(request.input.speciesASlug),
        normalizeContentSlug(request.input.speciesBSlug),
      ].sort();
      const expectedKey = createComparisonGenerationKey(
        canonicalSpeciesSlugs[0],
        canonicalSpeciesSlugs[1],
      );

      if (request.generationKey !== expectedKey) {
        throw new ContentServiceError(
          "The comparison generation key does not match the selected species.",
          "validation",
        );
      }

      const data = await loader({
        speciesASlug: canonicalSpeciesSlugs[0],
        speciesBSlug: canonicalSpeciesSlugs[1],
      });
      const validation = validateComparisonGuideData(data);
      if (!validation.valid) {
        throw new ContentServiceError(
          validation.issues.map((issue) => issue.message).join(" "),
          "validation",
        );
      }

      const { speciesA, speciesB, compatibility } = data;
      const title = `${speciesA.common_name} vs ${speciesB.common_name}`;
      const sourceReferences = data.sourceReferences.map((source) => ({
        title: source.sourceLabel ?? source.sourceUrl,
        url: source.sourceUrl,
        category: source.sourceCategory,
        confidence: source.confidence,
      }));

      return {
        title,
        slug: `${speciesA.slug}-vs-${speciesB.slug}`,
        summary: `Compare ${speciesA.common_name} and ${speciesB.common_name} using GuideMyTank’s structured tank-size, water-parameter, temperament, social, and compatibility data.`,
        seoTitle: `${title}: Tank Size, Care, and Compatibility`,
        metaDescription: `Compare ${speciesA.common_name} vs ${speciesB.common_name}, including tank size, water parameters, temperament, group needs, care level, and compatibility considerations.`,
        primarySearchIntent: `${speciesA.common_name} vs ${speciesB.common_name}`,
        sections: [
          {
            blockType: "paragraph",
            content: {
              text: `${speciesA.common_name} and ${speciesB.common_name} have different aquarium requirements. This comparison uses GuideMyTank’s structured species and compatibility data; confirm any complete livestock plan in the Aquarium Builder.`,
            },
          },
          {
            blockType: "heading",
            content: { text: "Side-by-side comparison", level: 2 },
          },
          {
            blockType: "comparison_table",
            content: {
              headers: [
                "Requirement",
                speciesA.common_name,
                speciesB.common_name,
              ],
              rows: [
                [
                  "Minimum tank size",
                  `${speciesA.tank_size_gal} gallons`,
                  `${speciesB.tank_size_gal} gallons`,
                ],
                [
                  "Temperature",
                  range(speciesA.min_temp_f, speciesA.max_temp_f, "°F"),
                  range(speciesB.min_temp_f, speciesB.max_temp_f, "°F"),
                ],
                [
                  "pH",
                  range(speciesA.min_ph, speciesA.max_ph),
                  range(speciesB.min_ph, speciesB.max_ph),
                ],
                [
                  "Adult size",
                  speciesA.max_size_inches == null
                    ? "Not available"
                    : `${speciesA.max_size_inches} inches`,
                  speciesB.max_size_inches == null
                    ? "Not available"
                    : `${speciesB.max_size_inches} inches`,
                ],
                [
                  "Temperament",
                  value(speciesA.temperament),
                  value(speciesB.temperament),
                ],
                [
                  "Care level",
                  value(speciesA.care_level),
                  value(speciesB.care_level),
                ],
                [
                  "Minimum group size",
                  value(speciesA.min_group_size),
                  value(speciesB.min_group_size),
                ],
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
              text: `The compatibility engine classifies this pairing as ${compatibility.compatibility} with ${Math.round((compatibility.confidence ?? 0) * 100)}% data confidence. ${compatibility.reasons.join(" ")}`,
            },
          },
          {
            blockType: "warning",
            content: {
              text: "A compatibility result is planning guidance, not a guarantee. Tank dimensions, group sizes, individual behavior, sex, décor, filtration, and the complete stocking plan can change the outcome.",
            },
          },
          {
            blockType: "heading",
            content: { text: "Which fish fits your aquarium?", level: 2 },
          },
          {
            blockType: "list",
            content: { items: choiceGuidance(data) },
          },
          {
            blockType: "faq_group",
            content: {
              items: [
                {
                  question: `Which needs the larger aquarium: ${speciesA.common_name} or ${speciesB.common_name}?`,
                  answer:
                    speciesA.tank_size_gal === speciesB.tank_size_gal
                      ? `Both species have a listed minimum tank size of ${speciesA.tank_size_gal} gallons.`
                      : `${speciesA.tank_size_gal! > speciesB.tank_size_gal! ? speciesA.common_name : speciesB.common_name} has the larger listed minimum tank size.`,
                },
                {
                  question: `Can ${speciesA.common_name} and ${speciesB.common_name} live together?`,
                  answer: `GuideMyTank currently classifies the pairing as ${compatibility.compatibility}. Review the full compatibility report and validate the complete aquarium rather than relying on a pair result alone.`,
                },
                {
                  question: `Do ${speciesA.common_name} and ${speciesB.common_name} need the same water parameters?`,
                  answer: `Their listed temperature and pH ranges are shown in the comparison table. A shared aquarium requires overlap across the complete recommended ranges.`,
                },
              ],
            },
          },
        ],
        sourceEntities: [
          {
            entityType: "species",
            entityKey: speciesA.slug,
            contributionRole: "comparison_subject",
            sourceUpdatedAt: speciesA.updated_at,
          },
          {
            entityType: "species",
            entityKey: speciesB.slug,
            contributionRole: "comparison_subject",
            sourceUpdatedAt: speciesB.updated_at,
          },
          {
            entityType: "compatibility",
            entityKey: expectedKey.replace("comparison:", ""),
            contributionRole: "compatibility_result",
            sourceFingerprint: `${compatibility.compatibility}:${compatibility.confidence}`,
          },
          ...data.sourceReferences.map((source) => ({
            entityType: "species_source_reference",
            entityKey: source.id,
            contributionRole: source.sourceCategory,
            sourceUpdatedAt: source.updatedAt,
            sourceFingerprint: `${source.sourceUrl}:${source.confidence}`,
          })),
        ],
        generationMetadata: {
          speciesIds: [speciesA.id, speciesB.id],
          speciesSlugs: [speciesA.slug, speciesB.slug],
          compatibility: {
            classification: compatibility.compatibility,
            confidence: compatibility.confidence,
            expertValidated: compatibility.expertValidated,
          },
          internalLinks: internalLinks(data),
          sourceReferences,
        } satisfies Json,
      };
    },
  };
}

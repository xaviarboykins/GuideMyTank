import { ContentServiceError } from "../../content/errors";
import { normalizeContentSlug } from "../../content/slug";
import { resolveInternalLinkPath } from "../../seo/internal-linking/route-resolver";
import type { Json } from "../../../types/database.types";
import { createTankMateGenerationKey } from "../generation/identity";
import type { GuideGenerator } from "../generation/types";

import {
  groupTankMateRecommendations,
  TANK_MATE_MINIMUM_CONFIDENCE,
} from "./policy";
import type {
  TankMateGuideData,
  TankMateGuideInput,
  TankMateGuideVariant,
} from "./types";
import { validateTankMateGuideData } from "./validation";

type TankMateDataLoader = (
  input: TankMateGuideInput,
) => Promise<TankMateGuideData>;

async function loadDefaultTankMateData(input: TankMateGuideInput) {
  const { loadTankMateGuideData } = await import("./loader");
  return loadTankMateGuideData(input);
}

function recommendationRows(
  results: TankMateGuideData["compatibilityResults"],
) {
  return results.map((result) => [
    result.species_b.common_name,
    `${Math.round((result.confidence ?? 0) * 100)}%`,
    result.reasons.join(" "),
  ]);
}

function compatibilityLinks(
  data: TankMateGuideData,
  resultSlugs: string[],
) {
  const resultSlugSet = new Set(resultSlugs);
  const careGuideBySpecies = new Map(
    data.careGuides.map((guide) => [guide.speciesSlug, guide]),
  );
  const targets = [
    {
      type: "species",
      title: data.targetSpecies.common_name,
      href: resolveInternalLinkPath({
        entityType: "species",
        slug: data.targetSpecies.slug,
      }),
    },
    {
      type: "builder",
      title: "Aquarium Builder",
      href: resolveInternalLinkPath({ entityType: "builder" }),
    },
    ...resultSlugs.flatMap((slug) => {
      const result = data.compatibilityResults.find(
        (candidate) => candidate.species_b.slug === slug,
      );
      if (!result || !resultSlugSet.has(slug)) return [];
      const careGuide = careGuideBySpecies.get(slug);
      return [
        {
          type: "compatibility-report",
          title: `${data.targetSpecies.common_name} and ${result.species_b.common_name} compatibility`,
          href: resolveInternalLinkPath({
            entityType: "compatibility-report",
            speciesASlug: data.targetSpecies.slug,
            speciesBSlug: slug,
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

function sectionsForVariant(
  data: TankMateGuideData,
  variant: TankMateGuideVariant,
) {
  const groups = groupTankMateRecommendations(data.compatibilityResults);
  const target = data.targetSpecies.common_name;
  const classificationSections = (
    heading: string,
    results: TankMateGuideData["compatibilityResults"],
    explanationHeading: string,
  ) => [
    {
      blockType: "heading" as const,
      content: { text: heading, level: 2 },
    },
    results.length
      ? {
          blockType: "comparison_table" as const,
          content: {
            headers: ["Species", "Data confidence", explanationHeading],
            rows: recommendationRows(results),
          },
        }
      : {
          blockType: "paragraph" as const,
          content: {
            text: `No species in the current dataset meet the confidence threshold for this ${heading.toLowerCase()} group.`,
          },
        },
  ];
  const recommendedSections = [
    ...classificationSections(
      `Recommended tank mates for ${target}`,
      groups.recommended,
      "Why it was classified",
    ),
    ...classificationSections(
      "Conditional tank mates",
      groups.conditional,
      "Conditions and concerns",
    ),
  ];
  const avoidSections = classificationSections(
    `Species to avoid with ${target}`,
    groups.avoid,
    "Why it was classified",
  );

  return variant === "avoid-with"
    ? [...avoidSections, ...recommendedSections]
    : [...recommendedSections, ...avoidSections];
}

export function createTankMateGuideGenerator(
  variant: TankMateGuideVariant,
  loader: TankMateDataLoader = loadDefaultTankMateData,
): GuideGenerator<TankMateGuideInput> {
  return {
    family: "tank_mates",
    guideType: variant,
    async generate(request) {
      const speciesSlug = normalizeContentSlug(request.input.speciesSlug);
      const expectedKey = createTankMateGenerationKey(speciesSlug, variant);

      if (request.input.variant !== variant) {
        throw new ContentServiceError(
          "The requested tank-mate variant does not match the generator.",
          "validation",
        );
      }

      if (request.generationKey !== expectedKey) {
        throw new ContentServiceError(
          "The tank-mate generation key does not match the selected species and variant.",
          "validation",
        );
      }

      const data = await loader({ speciesSlug, variant });
      const validation = validateTankMateGuideData(data, variant);
      if (!validation.valid) {
        throw new ContentServiceError(
          validation.issues.map((issue) => issue.message).join(" "),
          "validation",
        );
      }

      const groups = groupTankMateRecommendations(
        data.compatibilityResults,
      );
      const target = data.targetSpecies;
      const primaryResults =
        variant === "avoid-with" ? groups.avoid : groups.recommended;
      const linkedSlugs = [
        ...primaryResults,
        ...groups.conditional,
      ]
        .slice(0, 12)
        .map((result) => result.species_b.slug);
      const isAvoidGuide = variant === "avoid-with";
      const title = isAvoidGuide
        ? `Fish to Avoid with ${target.common_name}`
        : `Best Tank Mates for ${target.common_name}`;

      return {
        title,
        slug: isAvoidGuide
          ? `fish-to-avoid-with-${target.slug}`
          : `best-tank-mates-for-${target.slug}`,
        summary: isAvoidGuide
          ? `Review species the GuideMyTank compatibility engine classifies as incompatible with ${target.common_name}, including the structured reasons and confidence for each result.`
          : `Review compatible, conditional, and incompatible tank-mate classifications for ${target.common_name} using GuideMyTank’s structured compatibility data.`,
        seoTitle: title,
        metaDescription: isAvoidGuide
          ? `See fish to avoid with ${target.common_name}, based on structured compatibility results, confidence, and aquarium-planning constraints.`
          : `Compare the best tank mates for ${target.common_name}, conditional options, species to avoid, compatibility confidence, and planning constraints.`,
        primarySearchIntent: isAvoidGuide
          ? `fish to avoid with ${target.common_name}`
          : `best ${target.common_name} tank mates`,
        sections: [
          {
            blockType: "paragraph",
            content: {
              text: `This Guide groups potential tank mates using GuideMyTank’s compatibility engine and a minimum data-confidence threshold of ${Math.round(TANK_MATE_MINIMUM_CONFIDENCE * 100)}%. It does not treat a pair result as approval for a complete aquarium.`,
            },
          },
          {
            blockType: "heading",
            content: { text: `${target.common_name} compatibility requirements`, level: 2 },
          },
          {
            blockType: "list",
            content: {
              items: [
                `Listed temperament: ${target.temperament ?? "not available"}.`,
                `Listed minimum tank size: ${target.tank_size_gal ?? "not available"} gallons.`,
                `Listed minimum group size: ${target.min_group_size ?? "not available"}.`,
                `Preferred tank style: ${target.preferred_tank_style ?? "not available"}.`,
              ],
            },
          },
          ...sectionsForVariant(data, variant),
          {
            blockType: "warning",
            content: {
              text: "Compatibility classifications are planning guidance, not guarantees. Validate tank dimensions, water parameters, group sizes, sex, individual behavior, décor, filtration, and total stocking in the Aquarium Builder.",
            },
          },
          {
            blockType: "faq_group",
            content: {
              items: [
                {
                  question: `What makes a good tank mate for ${target.common_name}?`,
                  answer: `A candidate must meet the compatibility engine’s compatible classification and the ${Math.round(TANK_MATE_MINIMUM_CONFIDENCE * 100)}% confidence threshold used for this draft. The full aquarium still requires validation.`,
                },
                {
                  question: `Are conditional tank mates safe with ${target.common_name}?`,
                  answer:
                    "Conditional results contain structured concerns or setup dependencies. Review the pair report and complete aquarium before making a stocking decision.",
                },
                {
                  question: "Does a compatible result guarantee success?",
                  answer:
                    "No. Compatibility can change with aquarium size, group composition, individual behavior, territory, water conditions, and the rest of the stocking plan.",
                },
              ],
            },
          },
        ],
        sourceEntities: [
          {
            entityType: "species",
            entityKey: target.slug,
            contributionRole: "target_species",
            sourceUpdatedAt: target.updated_at,
          },
          ...data.candidates.map((candidate) => ({
            entityType: "species",
            entityKey: candidate.slug,
            contributionRole: "compatibility_candidate",
            sourceUpdatedAt: candidate.updated_at,
          })),
          ...data.compatibilityResults.map((result) => ({
            entityType: "compatibility_result",
            entityKey: `${target.slug}:${result.species_b.slug}`,
            contributionRole: result.compatibility ?? "unclassified",
            sourceFingerprint: JSON.stringify({
              classification: result.compatibility,
              confidence: result.confidence,
              reasons: result.reasons,
            }),
          })),
          ...data.sourceReferences.map((source) => ({
            entityType: "species_source_reference",
            entityKey: source.id,
            contributionRole: source.sourceCategory,
            sourceUpdatedAt: source.updatedAt,
            sourceFingerprint: `${source.sourceUrl}:${source.confidence}`,
          })),
        ],
        generationMetadata: {
          targetSpeciesId: target.id,
          targetSpeciesSlug: target.slug,
          variant,
          confidenceThreshold: TANK_MATE_MINIMUM_CONFIDENCE,
          recommendationCounts: {
            recommended: groups.recommended.length,
            conditional: groups.conditional.length,
            avoid: groups.avoid.length,
            excludedLowConfidence: groups.excludedLowConfidence.length,
          },
          internalLinks: compatibilityLinks(data, linkedSlugs),
          sourceReferences: data.sourceReferences.map((source) => ({
            title: source.sourceLabel ?? source.sourceUrl,
            url: source.sourceUrl,
            category: source.sourceCategory,
            confidence: source.confidence,
          })),
        } satisfies Json,
      };
    },
  };
}

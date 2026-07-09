import type { EvaluationResult, SpeciesRow } from "@/lib/compatibility/types";

type SpecialRuleHelpers = {
  hasTag: (species: SpeciesRow, tag: string) => boolean;
  isLongFinnedOrSlow: (species: SpeciesRow) => boolean;
  isPuffer: (species: SpeciesRow) => boolean;
  requiresGroup: (species: SpeciesRow) => boolean;
};

type SpeciesSpecialRule = {
  speciesSlug: string;
  evaluate: (
    species: SpeciesRow,
    tankmate: SpeciesRow,
    helpers: SpecialRuleHelpers,
  ) => EvaluationResult | null;
};

const peaPufferCautionTankmateSlugs = new Set([
  "chili-rasbora",
  "clown-killifish",
  "otocinclus-catfish",
  "zebra-danio",
]);

function createScoreCap(
  scoreCap: number,
  ...reasons: string[]
): EvaluationResult {
  return { points: 0, reasons, scoreCap };
}

function isPeaPufferCautionTankmate(
  species: SpeciesRow,
  helpers: SpecialRuleHelpers,
) {
  if (peaPufferCautionTankmateSlugs.has(species.slug)) {
    return true;
  }

  return (
    species.temperament === "Peaceful" &&
    helpers.requiresGroup(species) &&
    (helpers.hasTag(species, "top_water") ||
      helpers.hasTag(species, "mid_water")) &&
    !helpers.hasTag(species, "bottom_dweller") &&
    !helpers.isLongFinnedOrSlow(species) &&
    (species.max_size_inches ?? 99) <= 2.5
  );
}

const specialRules: SpeciesSpecialRule[] = [
  {
    speciesSlug: "pea-puffer",
    evaluate: (_species, tankmate, helpers) => {
      if (helpers.isPuffer(tankmate)) {
        return null;
      }

      if (isPeaPufferCautionTankmate(tankmate, helpers)) {
        return createScoreCap(
          60,
          "Pea puffers are best in species-only tanks; this tankmate is only a cautious option in a heavily planted aquarium.",
        );
      }

      return createScoreCap(
        45,
        "Pea puffers are specialist species-only fish unless tankmates are fast, non-sedentary, and carefully selected.",
      );
    },
  },
];

export function hasSpeciesSpecialRule(species: SpeciesRow) {
  return specialRules.some((rule) => rule.speciesSlug === species.slug);
}

export function evaluateSpeciesSpecialRules(
  speciesA: SpeciesRow,
  speciesB: SpeciesRow,
  helpers: SpecialRuleHelpers,
): EvaluationResult | null {
  const evaluations = specialRules.flatMap((rule) => {
    const results: EvaluationResult[] = [];

    if (speciesA.slug === rule.speciesSlug) {
      const result = rule.evaluate(speciesA, speciesB, helpers);

      if (result) results.push(result);
    }

    if (speciesB.slug === rule.speciesSlug) {
      const result = rule.evaluate(speciesB, speciesA, helpers);

      if (result) results.push(result);
    }

    return results;
  });

  if (!evaluations.length) {
    return null;
  }

  const scoreCaps = evaluations
    .map((evaluation) => evaluation.scoreCap)
    .filter((scoreCap): scoreCap is number => scoreCap != null);

  return {
    points: evaluations.reduce(
      (total, evaluation) => total + evaluation.points,
      0,
    ),
    reasons: evaluations.flatMap((evaluation) => evaluation.reasons),
    scoreCap: scoreCaps.length ? Math.min(...scoreCaps) : undefined,
  };
}

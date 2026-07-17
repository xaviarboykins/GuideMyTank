import type { AquariumResolvedLivestockEntry } from "@/lib/aquarium-builder/types";

import { AQUARIUM_VALIDATION_CODES } from "../constants";
import { createValidationIssue } from "../issues";
import type {
  AquariumValidationIssue,
  AquariumValidator,
  ResolvedCompatibilityResult,
} from "../types";

const TERRITORIAL_SIGNAL_PATTERN =
  /territor|breeding aggression|solitary aggressive/i;

function hasTag(entry: AquariumResolvedLivestockEntry, tag: string) {
  return entry.species.compatibility_tags.some(
    (candidate) => candidate.toLowerCase() === tag,
  );
}

function getTerritorialEvidence(
  compatibilityResult: ResolvedCompatibilityResult,
) {
  const result = compatibilityResult.result;

  if (!result) {
    return [];
  }

  return Array.from(
    new Set(
      [result.notes, ...result.reasons].filter(
        (evidence): evidence is string =>
          typeof evidence === "string" &&
          TERRITORIAL_SIGNAL_PATTERN.test(evidence),
      ),
    ),
  );
}

function aggregateLivestock(entries: AquariumResolvedLivestockEntry[]) {
  const aggregated = new Map<
    string,
    { entry: AquariumResolvedLivestockEntry; quantity: number }
  >();

  for (const entry of entries) {
    const current = aggregated.get(entry.species.id);
    const quantity =
      Number.isInteger(entry.quantity) && entry.quantity > 0
        ? entry.quantity
        : 0;

    if (current) {
      current.quantity += quantity;
    } else {
      aggregated.set(entry.species.id, { entry, quantity });
    }
  }

  return Array.from(aggregated.values()).sort((entryA, entryB) =>
    entryA.entry.species.id.localeCompare(entryB.entry.species.id),
  );
}

function validateSameSpecies(
  entries: AquariumResolvedLivestockEntry[],
): AquariumValidationIssue[] {
  const issues: AquariumValidationIssue[] = [];

  for (const livestock of aggregateLivestock(entries)) {
    const item = livestock.entry.species;
    const solitaryTerritorial =
      hasTag(livestock.entry, "territorial") &&
      (hasTag(livestock.entry, "solitary") || item.species_only_preferred);
    const documentedAggression =
      (item.aggression_level ?? 0) >= 5 ||
      item.temperament === "Aggressive" ||
      item.breeding_aggression;

    if (
      livestock.quantity <= 1 ||
      !solitaryTerritorial ||
      !documentedAggression
    ) {
      continue;
    }

    issues.push(
      createValidationIssue({
        code: AQUARIUM_VALIDATION_CODES.territorialSameSpeciesConflict,
        category: "territorial",
        severity: "warning",
        title: `${item.common_name} may have same-species territorial conflict`,
        message: `${livestock.quantity} ${item.common_name} are selected, but this species is documented as solitary and territorial with aggressive behavior.`,
        recommendation:
          "Confirm a species-specific grouping plan and provide adequate separated territories, or keep only one individual.",
        affectedSpeciesIds: [item.id],
        metadata: {
          currentQuantity: livestock.quantity,
          aggressionLevel: item.aggression_level,
          breedingAggression: item.breeding_aggression,
          speciesOnlyPreferred: item.species_only_preferred,
        },
      }),
    );
  }

  return issues;
}

function validateSpeciesPairs(
  context: Parameters<AquariumValidator["validate"]>[0],
): AquariumValidationIssue[] {
  const speciesById = new Map(
    context.species.map((entry) => [entry.species.id, entry.species]),
  );
  const issues: AquariumValidationIssue[] = [];

  for (const compatibilityResult of context.compatibilityResults) {
    const result = compatibilityResult.result;
    const evidence = getTerritorialEvidence(compatibilityResult);

    if (
      evidence.length === 0 ||
      !result ||
      result.compatibility === "compatible" ||
      result.compatibility == null
    ) {
      continue;
    }

    const speciesA = speciesById.get(compatibilityResult.speciesAId);
    const speciesB = speciesById.get(compatibilityResult.speciesBId);
    const pairLabel = `${speciesA?.common_name ?? "Selected species"} and ${speciesB?.common_name ?? "selected species"}`;
    const incompatible = result.compatibility === "incompatible";

    issues.push(
      createValidationIssue({
        code: AQUARIUM_VALIDATION_CODES.territorialPairConflict,
        category: "territorial",
        severity: incompatible ? "error" : "warning",
        title: `Territorial conflict between ${pairLabel}`,
        message: evidence.join(" "),
        recommendation:
          "Use a larger footprint with separate territories and sight breaks, or choose a different species pairing.",
        affectedSpeciesIds: [
          compatibilityResult.speciesAId,
          compatibilityResult.speciesBId,
        ],
        metadata: {
          compatibility: result.compatibility,
          compatibilityScore: result.score,
          evidence,
        },
      }),
    );
  }

  return issues;
}

export const territorialValidator: AquariumValidator = {
  name: "territorial",

  async validate(context): Promise<AquariumValidationIssue[]> {
    return [
      ...validateSameSpecies(context.species),
      ...validateSpeciesPairs(context),
    ];
  },
};

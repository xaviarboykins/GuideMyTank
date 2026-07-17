import {
  deduplicateValidationIssues,
  sortValidationIssues,
  summarizeValidationIssues,
} from "./issues";
import { generateUniqueSpeciesPairs } from "./pairs";
import { getCompatibility } from "../compatibility/service";
import {
  analyzeStocking,
  normalizeStockingAnalysisInput,
} from "../aquarium-builder/stocking-analysis";
import type {
  AquariumCompatibilityResolver,
  AquariumValidationInput,
  AquariumValidationIssue,
  AquariumValidationOptions,
  AquariumValidationReport,
  AquariumValidatorContext,
} from "./types";
import { aquariumValidators } from "./validators";

function normalizeValidationInput(
  input: AquariumValidationInput,
): AquariumValidationInput {
  const rawInput = input as AquariumValidationInput | null | undefined;

  return {
    ...rawInput,
    tank: rawInput?.tank ?? {
      sizeGallons: 0,
      filtrationLevel: "standard",
      plantedLevel: "none",
    },
    livestock: Array.isArray(rawInput?.livestock) ? rawInput.livestock : [],
    plants: Array.isArray(rawInput?.plants) ? rawInput.plants : [],
    equipment: Array.isArray(rawInput?.equipment) ? rawInput.equipment : [],
  };
}

const defaultCompatibilityResolver: AquariumCompatibilityResolver = (
  speciesASlug,
  speciesBSlug,
) => getCompatibility(speciesASlug, speciesBSlug);

async function resolveCompatibilityResults(
  speciesPairs: AquariumValidatorContext["speciesPairs"],
  resolver: AquariumCompatibilityResolver,
  onError?: AquariumValidationOptions["onCompatibilityError"],
): Promise<AquariumValidatorContext["compatibilityResults"]> {
  const results: AquariumValidatorContext["compatibilityResults"] = [];

  for (const pair of speciesPairs) {
    try {
      results.push({
        speciesAId: pair.speciesA.species.id,
        speciesBId: pair.speciesB.species.id,
        result: await resolver(
          pair.speciesA.species.slug,
          pair.speciesB.species.slug,
        ),
      });
    } catch (error) {
      onError?.(pair.key, error);
      results.push({
        speciesAId: pair.speciesA.species.id,
        speciesBId: pair.speciesB.species.id,
        result: null,
      });
    }
  }

  return results;
}

export async function validateAquarium(
  input: AquariumValidationInput,
  options: AquariumValidationOptions = {},
): Promise<AquariumValidationReport> {
  const normalizedInput = normalizeValidationInput(input);
  const species = options.context?.species ?? [];
  const speciesPairs =
    options.context?.speciesPairs ?? generateUniqueSpeciesPairs(species);
  const compatibilityResults =
    options.context?.compatibilityResults ??
    (await resolveCompatibilityResults(
      speciesPairs,
      options.compatibilityResolver ?? defaultCompatibilityResolver,
      options.onCompatibilityError,
    ));
  const stockingAnalysis =
    options.context && "stockingAnalysis" in options.context
      ? options.context.stockingAnalysis
      : analyzeStocking(
          normalizeStockingAnalysisInput(
            normalizedInput,
            species.map((entry) => entry.species),
          ),
        );
  const context: AquariumValidatorContext = {
    input: normalizedInput,
    species,
    speciesPairs,
    compatibilityResults,
    stockingAnalysis,
  };
  const issues: AquariumValidationIssue[] = [];

  for (const validator of options.validators ?? aquariumValidators) {
    try {
      issues.push(...(await validator.validate(context)));
    } catch (error) {
      options.onValidatorError?.(validator.name, error);
    }
  }

  const sortedIssues = sortValidationIssues(
    deduplicateValidationIssues(issues),
  );
  const summary = summarizeValidationIssues(sortedIssues);

  return {
    valid: summary.errorCount === 0,
    issues: sortedIssues,
    summary,
    evaluatedAt: (options.now?.() ?? new Date()).toISOString(),
  };
}

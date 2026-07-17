import { AQUARIUM_VALIDATION_CODES } from "../constants";
import { createValidationIssue } from "../issues";
import type {
  AquariumValidationIssue,
  AquariumValidator,
  ResolvedCompatibilityResult,
} from "../types";

const PREDATION_SIGNAL_PATTERN =
  /predat|may eat|can eat|not safe with invertebrates/i;
const NEGATED_PREDATION_SIGNAL_PATTERN = /no predation risk/i;

function getPredationEvidence(
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
          PREDATION_SIGNAL_PATTERN.test(evidence) &&
          !NEGATED_PREDATION_SIGNAL_PATTERN.test(evidence),
      ),
    ),
  );
}

export const predationValidator: AquariumValidator = {
  name: "predation",

  async validate(context): Promise<AquariumValidationIssue[]> {
    const speciesById = new Map(
      context.species.map((entry) => [entry.species.id, entry.species]),
    );
    const issues: AquariumValidationIssue[] = [];

    for (const compatibilityResult of context.compatibilityResults) {
      const result = compatibilityResult.result;
      const evidence = getPredationEvidence(compatibilityResult);

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
      const highRisk = result.compatibility === "incompatible";

      issues.push(
        createValidationIssue({
          code: highRisk
            ? AQUARIUM_VALIDATION_CODES.predationHighRisk
            : AQUARIUM_VALIDATION_CODES.predationPossible,
          category: "predation",
          severity: highRisk ? "error" : "warning",
          title: highRisk
            ? `High predation risk between ${pairLabel}`
            : `Possible predation risk between ${pairLabel}`,
          message: evidence.join(" "),
          recommendation:
            "Do not combine this pair unless reliable species-specific guidance confirms the risk can be managed.",
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
  },
};

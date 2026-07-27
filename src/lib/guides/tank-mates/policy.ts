import type { CompatibilityResult } from "../../compatibility/types";

import type { TankMateRecommendationGroups } from "./types";

export const TANK_MATE_MINIMUM_CONFIDENCE = 0.75;

function byConfidenceAndName(
  resultA: CompatibilityResult,
  resultB: CompatibilityResult,
) {
  return (
    (resultB.confidence ?? 0) - (resultA.confidence ?? 0) ||
    resultA.species_b.common_name.localeCompare(
      resultB.species_b.common_name,
    )
  );
}

export function groupTankMateRecommendations(
  results: CompatibilityResult[],
  minimumConfidence = TANK_MATE_MINIMUM_CONFIDENCE,
): TankMateRecommendationGroups {
  const groups: TankMateRecommendationGroups = {
    recommended: [],
    conditional: [],
    avoid: [],
    excludedLowConfidence: [],
  };

  for (const result of results) {
    if (
      result.confidence == null ||
      result.confidence < minimumConfidence ||
      result.compatibility == null
    ) {
      groups.excludedLowConfidence.push(result);
      continue;
    }

    if (result.compatibility === "compatible") {
      groups.recommended.push(result);
    } else if (result.compatibility === "caution") {
      groups.conditional.push(result);
    } else if (result.compatibility === "incompatible") {
      groups.avoid.push(result);
    }
  }

  groups.recommended.sort(byConfidenceAndName);
  groups.conditional.sort(byConfidenceAndName);
  groups.avoid.sort(byConfidenceAndName);
  groups.excludedLowConfidence.sort(byConfidenceAndName);

  return groups;
}


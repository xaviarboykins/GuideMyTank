import type { ValidationIssue, ValidationResult } from "../../content/types";

import { groupTankMateRecommendations } from "./policy";
import type { TankMateGuideData, TankMateGuideVariant } from "./types";

export function validateTankMateGuideData(
  data: TankMateGuideData,
  variant: TankMateGuideVariant,
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const groups = groupTankMateRecommendations(data.compatibilityResults);

  if (!data.candidates.length || !data.compatibilityResults.length) {
    issues.push({
      field: "compatibility",
      code: "source_data_missing",
      message: "No compatibility candidates are available for this species.",
    });
  }

  if (variant === "tank-mates" && groups.recommended.length === 0) {
    issues.push({
      field: "recommendations",
      code: "minimum",
      message:
        "No compatible species meet the accepted confidence threshold.",
    });
  }

  if (variant === "avoid-with" && groups.avoid.length === 0) {
    issues.push({
      field: "recommendations",
      code: "minimum",
      message:
        "No incompatible species meet the accepted confidence threshold.",
    });
  }

  return issues.length
    ? { valid: false, issues }
    : { valid: true, issues: [] };
}


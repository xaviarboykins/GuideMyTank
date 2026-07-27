import type { ValidationIssue, ValidationResult } from "../../content/types";

import { evaluateTankSizeSuitability } from "./policy";
import type { TankSizeGuideData, TankSizeGuideInput } from "./types";

export const MINIMUM_TANK_SIZE_GUIDE_SPECIES = 3;

export function validateTankSizeGuideData(
  data: TankSizeGuideData,
  input: TankSizeGuideInput,
): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!Number.isInteger(input.gallons) || input.gallons <= 0) {
    issues.push({
      field: "gallons",
      code: "format",
      message: "Tank size must be a positive whole number of gallons.",
    });
  }

  const suitability = evaluateTankSizeSuitability(data, input);
  if (suitability.suitable.length < MINIMUM_TANK_SIZE_GUIDE_SPECIES) {
    issues.push({
      field: "recommendations",
      code: "minimum",
      message: `At least ${MINIMUM_TANK_SIZE_GUIDE_SPECIES} species with complete stocking profiles are required.`,
    });
  }

  return issues.length
    ? { valid: false, issues }
    : { valid: true, issues: [] };
}


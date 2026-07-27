import type { ValidationIssue, ValidationResult } from "../../content/types";

import type { ComparisonGuideData } from "./types";

const REQUIRED_COMPARISON_FIELDS = [
  "tank_size_gal",
  "min_temp_f",
  "max_temp_f",
  "min_ph",
  "max_ph",
] as const;

export function validateComparisonGuideData(
  data: ComparisonGuideData,
): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (data.speciesA.id === data.speciesB.id) {
    issues.push({
      field: "species",
      code: "duplicate",
      message: "Select two different species for a comparison Guide.",
    });
  }

  for (const species of [data.speciesA, data.speciesB]) {
    for (const field of REQUIRED_COMPARISON_FIELDS) {
      if (species[field] == null) {
        issues.push({
          field: `species.${species.slug}.${field}`,
          code: "source_data_missing",
          message: `${species.common_name} is missing ${field.replaceAll("_", " ")} data required for comparison.`,
        });
      }
    }
  }

  if (
    data.compatibility.compatibility == null ||
    data.compatibility.confidence == null
  ) {
    issues.push({
      field: "compatibility",
      code: "source_data_missing",
      message:
        "The compatibility engine did not return a complete comparison result.",
    });
  }

  return issues.length
    ? { valid: false, issues }
    : { valid: true, issues: [] };
}


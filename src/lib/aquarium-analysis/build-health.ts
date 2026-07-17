import type { AquariumBuild } from "@/lib/aquarium-builder/types";
import type { StockingAnalysisResult } from "@/lib/aquarium-builder/stocking-analysis/types";
import type {
  AquariumValidationIssue,
  AquariumValidationReport,
} from "@/lib/aquarium-validation/types";

export type AquariumBuildHealthStatus =
  | "excellent"
  | "healthy"
  | "needs-attention"
  | "high-risk"
  | "invalid";

export type AquariumBuildHealthReasonCode =
  | "VALIDATION_ERRORS"
  | "HIGH_RISK_WARNING"
  | "MULTIPLE_WARNINGS"
  | "VALIDATION_WARNING"
  | "INCOMPLETE_ANALYSIS"
  | "INFORMATIONAL_FINDINGS"
  | "CORE_EQUIPMENT_INCOMPLETE"
  | "ALL_CHECKS_CLEAR";

export interface AquariumBuildHealthReason {
  code: AquariumBuildHealthReasonCode;
  message: string;
  validationIssueCodes?: string[];
}

export interface AquariumBuildHealth {
  status: AquariumBuildHealthStatus;
  label: "Excellent" | "Healthy" | "Needs Attention" | "High Risk" | "Invalid";
  reasons: AquariumBuildHealthReason[];
}

export interface AquariumBuildHealthInput {
  build: AquariumBuild;
  stocking: StockingAnalysisResult;
  validation: AquariumValidationReport;
}

const INCOMPLETE_FINDING_CODES = new Set([
  "COMPATIBILITY_UNKNOWN",
  "HEATING_REQUIREMENT_UNAVAILABLE",
  "HEATER_SPECIFICATION_MISSING",
  "STOCKING_ANALYSIS_UNAVAILABLE",
  "TANK_NOT_SELECTED",
  "WATER_PARAMETER_DATA_INCOMPLETE",
]);

function issueCodes(issues: AquariumValidationIssue[]) {
  return Array.from(new Set(issues.map((issue) => issue.code))).sort();
}

function hasCoreAnalysisInput(input: AquariumBuildHealthInput) {
  return (
    Number.isFinite(input.build.tank.sizeGallons) &&
    input.build.tank.sizeGallons > 0 &&
    input.build.livestock.length > 0 &&
    input.stocking.analysisComplete
  );
}

function hasFilter(build: AquariumBuild) {
  return build.equipment.some((item) => item.category === "filter");
}

/**
 * Derives a user-facing health classification from existing analysis only.
 * This function does not recalculate validation, stocking, compatibility, or
 * heater suitability.
 */
export function deriveAquariumBuildHealth(
  input: AquariumBuildHealthInput,
): AquariumBuildHealth {
  const errors = input.validation.issues.filter(
    (issue) => issue.severity === "error",
  );
  const warnings = input.validation.issues.filter(
    (issue) => issue.severity === "warning",
  );
  const information = input.validation.issues.filter(
    (issue) => issue.severity === "info",
  );

  if (errors.length > 0) {
    return {
      status: "invalid",
      label: "Invalid",
      reasons: [
        {
          code: "VALIDATION_ERRORS",
          message: `${errors.length} validation ${errors.length === 1 ? "error prevents" : "errors prevent"} this build from being considered safe to finalize.`,
          validationIssueCodes: issueCodes(errors),
        },
      ],
    };
  }

  if (warnings.length >= 3) {
    return {
      status: "high-risk",
      label: "High Risk",
      reasons: [
        {
          code: "MULTIPLE_WARNINGS",
          message: `${warnings.length} validation warnings combine to create elevated build risk.`,
          validationIssueCodes: issueCodes(warnings),
        },
      ],
    };
  }

  if (warnings.length === 2) {
    return {
      status: "needs-attention",
      label: "Needs Attention",
      reasons: [
        {
          code: "MULTIPLE_WARNINGS",
          message: "Two validation warnings should be reviewed before finalizing this build.",
          validationIssueCodes: issueCodes(warnings),
        },
      ],
    };
  }

  if (warnings.length === 1) {
    return {
      status: "healthy",
      label: "Healthy",
      reasons: [
        {
          code: "VALIDATION_WARNING",
          message: `This build is healthy with one advisory: ${warnings[0].title}.`,
          validationIssueCodes: issueCodes(warnings),
        },
      ],
    };
  }

  const incompleteFindings = information.filter((issue) =>
    INCOMPLETE_FINDING_CODES.has(issue.code),
  );

  if (!hasCoreAnalysisInput(input) || incompleteFindings.length > 0) {
    return {
      status: "needs-attention",
      label: "Needs Attention",
      reasons: [
        {
          code: "INCOMPLETE_ANALYSIS",
          message:
            "The build or its supporting data is incomplete, so a healthy result cannot yet be confirmed.",
          validationIssueCodes: issueCodes(incompleteFindings),
        },
      ],
    };
  }

  if (information.length > 0) {
    return {
      status: "healthy",
      label: "Healthy",
      reasons: [
        {
          code: "INFORMATIONAL_FINDINGS",
          message:
            "No errors or warnings were found, but informational guidance remains available.",
          validationIssueCodes: issueCodes(information),
        },
      ],
    };
  }

  if (!hasFilter(input.build)) {
    return {
      status: "healthy",
      label: "Healthy",
      reasons: [
        {
          code: "CORE_EQUIPMENT_INCOMPLETE",
          message:
            "Current analysis is healthy, but a filter must be selected before the build is complete.",
        },
      ],
    };
  }

  return {
    status: "excellent",
    label: "Excellent",
    reasons: [
      {
        code: "ALL_CHECKS_CLEAR",
        message:
          "The analyzed build is complete and has no validation errors, warnings, or informational findings.",
      },
    ],
  };
}

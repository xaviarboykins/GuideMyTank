import type {
  AquariumValidationReport,
  ValidationCategory,
} from "@/lib/aquarium-validation";
import type { AquariumBuildHealth } from "@/lib/aquarium-analysis/build-health";

export type ValidationDisplayTone =
  | "success"
  | "neutral"
  | "warning"
  | "critical";

export interface ValidationDisplayState {
  label: string;
  overallLabel: string;
  tone: ValidationDisplayTone;
}

export function getBuildHealthDisplayState(
  health: AquariumBuildHealth | null,
  isLoading: boolean,
  isUnavailable: boolean,
): ValidationDisplayState {
  if (isLoading && !health) {
    return { label: "Checking...", overallLabel: "Checking build", tone: "neutral" };
  }

  if (isUnavailable) {
    return { label: "Unavailable", overallLabel: "Analysis unavailable", tone: "warning" };
  }

  if (!health) {
    return { label: "Pending", overallLabel: "Waiting to analyze", tone: "neutral" };
  }

  if (health.status === "invalid" || health.status === "high-risk") {
    return { label: health.label, overallLabel: health.label, tone: "critical" };
  }

  if (health.status === "needs-attention") {
    return { label: health.label, overallLabel: health.label, tone: "warning" };
  }

  return { label: health.label, overallLabel: health.label, tone: "success" };
}

export function getBuildHealthStatusLabel(
  health: AquariumBuildHealth | null,
  report: AquariumValidationReport | null,
) {
  if (!health) {
    return null;
  }

  const contributingCodes = new Set(
    health.reasons.flatMap((reason) => reason.validationIssueCodes ?? []),
  );
  const contributingIssue = report?.issues.find((issue) =>
    contributingCodes.has(issue.code),
  );

  return contributingIssue
    ? `${health.label} — ${contributingIssue.title}`
    : health.label;
}

const compatibilityCategories = new Set<ValidationCategory>([
  "compatibility",
  "predation",
  "territorial",
]);

export function getValidationDisplayState(
  report: AquariumValidationReport | null,
  isLoading: boolean,
  isUnavailable: boolean,
): ValidationDisplayState {
  if (isLoading) {
    return { label: "Checking...", overallLabel: "Checking build", tone: "neutral" };
  }

  if (isUnavailable) {
    return { label: "Unavailable", overallLabel: "Validation unavailable", tone: "warning" };
  }

  if (!report) {
    return { label: "Pending", overallLabel: "Waiting to validate", tone: "neutral" };
  }

  if (report.summary.errorCount > 0) {
    const count = report.summary.errorCount;
    return {
      label: `${count} ${count === 1 ? "error" : "errors"}`,
      overallLabel: "Action required",
      tone: "critical",
    };
  }

  if (report.summary.warningCount > 0) {
    const count = report.summary.warningCount;
    return {
      label: `${count} ${count === 1 ? "warning" : "warnings"}`,
      overallLabel: "Review warnings",
      tone: "warning",
    };
  }

  return { label: "No errors", overallLabel: "Build valid", tone: "success" };
}

export function getCompatibilityDisplayState(
  report: AquariumValidationReport | null,
  isLoading: boolean,
  isUnavailable: boolean,
): ValidationDisplayState {
  if (isLoading || isUnavailable || !report) {
    return getValidationDisplayState(null, isLoading, isUnavailable);
  }

  const issues = report.issues.filter((issue) =>
    compatibilityCategories.has(issue.category),
  );
  const errorCount = issues.filter((issue) => issue.severity === "error").length;
  const warningCount = issues.filter(
    (issue) => issue.severity === "warning",
  ).length;

  if (errorCount > 0) {
    return { label: "Conflicts found", overallLabel: "Action required", tone: "critical" };
  }

  if (warningCount > 0) {
    return { label: "Review warnings", overallLabel: "Review warnings", tone: "warning" };
  }

  return { label: "No conflicts", overallLabel: "Compatible", tone: "success" };
}

import type {
  AquariumValidationReport,
  ValidationCategory,
} from "@/lib/aquarium-validation";

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

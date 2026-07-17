import { describe, expect, it } from "vitest";

import type {
  AquariumValidationIssue,
  AquariumValidationReport,
} from "@/lib/aquarium-validation";

import {
  getBuildHealthDisplayState,
  getBuildHealthStatusLabel,
  getCompatibilityDisplayState,
  getValidationDisplayState,
} from "./validation-display";

function report(
  issues: AquariumValidationReport["issues"],
): AquariumValidationReport {
  const infoCount = issues.filter((issue) => issue.severity === "info").length;
  const warningCount = issues.filter(
    (issue) => issue.severity === "warning",
  ).length;
  const errorCount = issues.filter((issue) => issue.severity === "error").length;

  return {
    valid: errorCount === 0,
    issues,
    summary: {
      infoCount,
      warningCount,
      errorCount,
      totalCount: issues.length,
    },
    evaluatedAt: "2026-07-16T00:00:00.000Z",
  };
}

const baseIssue: Omit<AquariumValidationIssue, "category" | "severity"> = {
  id: "issue-1",
  code: "test-code",
  title: "Test finding",
  message: "Test message",
  affectedSpeciesIds: [],
};

describe("aquarium builder validation display", () => {
  it("prioritizes errors in the overall status", () => {
    const state = getValidationDisplayState(
      report([
        { ...baseIssue, category: "tank_size", severity: "warning" },
        { ...baseIssue, id: "issue-2", category: "stocking", severity: "error" },
      ]),
      false,
      false,
    );

    expect(state).toEqual({
      label: "1 error",
      overallLabel: "Action required",
      tone: "critical",
    });
  });

  it("reports a clean compatibility result when findings are unrelated", () => {
    const state = getCompatibilityDisplayState(
      report([{ ...baseIssue, category: "tank_size", severity: "warning" }]),
      false,
      false,
    );

    expect(state.label).toBe("No conflicts");
    expect(state.tone).toBe("success");
  });

  it("shows compatibility conflicts independently of the overall count", () => {
    const state = getCompatibilityDisplayState(
      report([{ ...baseIssue, category: "predation", severity: "error" }]),
      false,
      false,
    );

    expect(state.label).toBe("Conflicts found");
    expect(state.tone).toBe("critical");
  });

  it("represents loading and unavailable states without a report", () => {
    expect(getValidationDisplayState(null, true, false).label).toBe("Checking...");
    expect(getValidationDisplayState(null, false, true).label).toBe("Unavailable");
  });

  it("maps Build Health to compact status tones", () => {
    expect(
      getBuildHealthDisplayState(
        { status: "excellent", label: "Excellent", reasons: [] },
        false,
        false,
      ),
    ).toMatchObject({ label: "Excellent", tone: "success" });
    expect(
      getBuildHealthDisplayState(
        { status: "needs-attention", label: "Needs Attention", reasons: [] },
        false,
        false,
      ),
    ).toMatchObject({ tone: "warning" });
    expect(
      getBuildHealthDisplayState(
        { status: "high-risk", label: "High Risk", reasons: [] },
        false,
        false,
      ),
    ).toMatchObject({ tone: "critical" });
  });

  it("names the validation finding responsible for Build Health", () => {
    const validationReport = report([
      {
        ...baseIssue,
        code: "WATER_PH_NARROW_OVERLAP",
        title: "Shared pH range is narrow",
        category: "water_parameters",
        severity: "warning",
      },
    ]);

    expect(
      getBuildHealthStatusLabel(
        {
          status: "healthy",
          label: "Healthy",
          reasons: [
            {
              code: "VALIDATION_WARNING",
              message: "Review one warning.",
              validationIssueCodes: ["WATER_PH_NARROW_OVERLAP"],
            },
          ],
        },
        validationReport,
      ),
    ).toBe("Healthy — Shared pH range is narrow");
  });
});

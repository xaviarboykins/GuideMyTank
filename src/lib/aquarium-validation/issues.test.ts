import { describe, expect, it } from "vitest";

import {
  createValidationIssue,
  deduplicateValidationIssues,
  getValidationIssueKey,
  sortValidationIssues,
  summarizeValidationIssues,
} from "./issues";
import type {
  AquariumValidationIssue,
  ValidationSeverity,
} from "./types";

function issue(
  code: string,
  severity: ValidationSeverity = "warning",
  overrides: Partial<AquariumValidationIssue> = {},
) {
  return createValidationIssue({
    code,
    category: "compatibility",
    severity,
    title: code,
    message: `${code} message`,
    affectedSpeciesIds: ["species-b", "species-a"],
    ...overrides,
  });
}

describe("validation issue utilities", () => {
  it("creates stable IDs independent of species pair order", () => {
    const issueA = issue("PAIR_RISK", "warning", {
      affectedSpeciesIds: ["species-a", "species-b"],
    });
    const issueB = issue("PAIR_RISK", "warning", {
      affectedSpeciesIds: ["species-b", "species-a"],
    });

    expect(issueA.id).toBe(issueB.id);
    expect(getValidationIssueKey(issueA)).toBe(getValidationIssueKey(issueB));
    expect(issueA.affectedSpeciesIds).toEqual(["species-a", "species-b"]);
  });

  it("creates stable IDs independent of metadata property order", () => {
    const issueA = issue("METADATA", "info", {
      metadata: { current: 3, expected: 6 },
    });
    const issueB = issue("METADATA", "info", {
      metadata: { expected: 6, current: 3 },
    });

    expect(issueA.id).toBe(issueB.id);
  });

  it("deduplicates exact rule, species, and metadata findings", () => {
    const duplicateA = issue("DUPLICATE", "warning");
    const duplicateB = issue("DUPLICATE", "warning", {
      affectedSpeciesIds: ["species-a", "species-b"],
    });
    const distinct = issue("DUPLICATE", "warning", {
      metadata: { quantity: 2 },
    });

    expect(
      deduplicateValidationIssues([duplicateA, duplicateB, distinct]),
    ).toHaveLength(2);
  });

  it("sorts by severity, category, code, title, and species IDs", () => {
    const issues = [
      issue("INFO", "info"),
      issue("WARNING_B", "warning", { category: "tank_size" }),
      issue("ERROR_B", "error", { category: "stocking" }),
      issue("ERROR_A", "error", { category: "compatibility" }),
      issue("WARNING_A", "warning", { category: "tank_size" }),
    ];

    expect(sortValidationIssues(issues).map((item) => item.code)).toEqual([
      "ERROR_A",
      "ERROR_B",
      "WARNING_A",
      "WARNING_B",
      "INFO",
    ]);
  });

  it("calculates severity and total counts", () => {
    expect(
      summarizeValidationIssues([
        issue("ERROR", "error"),
        issue("WARNING", "warning"),
        issue("INFO_A", "info"),
        issue("INFO_B", "info"),
      ]),
    ).toEqual({
      errorCount: 1,
      warningCount: 1,
      infoCount: 2,
      totalCount: 4,
    });
  });
});

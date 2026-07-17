import { describe, expect, it } from "vitest";

import { analyzeStocking } from "../aquarium-builder/stocking-analysis/engine";
import type { AquariumBuild } from "../aquarium-builder/types";
import {
  createValidationIssue,
  summarizeValidationIssues,
} from "../aquarium-validation/issues";
import type {
  AquariumValidationIssue,
  AquariumValidationReport,
  ValidationCategory,
  ValidationSeverity,
} from "../aquarium-validation/types";

import { deriveAquariumBuildHealth } from "./build-health";

function build({
  tankGallons = 20,
  livestock = true,
  filter = true,
}: {
  tankGallons?: number;
  livestock?: boolean;
  filter?: boolean;
} = {}): AquariumBuild {
  return {
    tank: {
      sizeGallons: tankGallons,
      filtrationLevel: "standard",
      plantedLevel: "none",
    },
    livestock: livestock
      ? [{ speciesSlug: "test-species", quantity: 1 }]
      : [],
    plants: [],
    equipment: filter
      ? [
          {
            name: "Test Filter",
            category: "filter",
            quantity: 1,
            estimatedPrice: 20,
          },
        ]
      : [],
  };
}

function issue(
  code: string,
  severity: ValidationSeverity,
  category: ValidationCategory = "stocking",
): AquariumValidationIssue {
  return createValidationIssue({
    code,
    severity,
    category,
    title: code,
    message: `${code} message`,
  });
}

function report(issues: AquariumValidationIssue[] = []): AquariumValidationReport {
  return {
    valid: !issues.some((item) => item.severity === "error"),
    issues,
    summary: summarizeValidationIssues(issues),
    evaluatedAt: "2026-07-17T12:00:00.000Z",
  };
}

function stocking(complete = true) {
  const result = analyzeStocking({
    tankGallons: 20,
    filtrationLevel: "standard",
    plantedLevel: "none",
    livestock: [
      {
        speciesId: "test",
        speciesName: "Test Species",
        quantity: 1,
        bioloadScore: complete ? 2 : null,
      },
    ],
  });

  return result;
}

describe("deriveAquariumBuildHealth", () => {
  it("marks any validation error invalid", () => {
    const result = deriveAquariumBuildHealth({
      build: build(),
      stocking: stocking(),
      validation: report([
        issue("HEATER_REQUIRED_MISSING", "error", "heating"),
      ]),
    });

    expect(result).toMatchObject({ status: "invalid", label: "Invalid" });
    expect(result.reasons[0].validationIssueCodes).toEqual([
      "HEATER_REQUIRED_MISSING",
    ]);
  });

  it.each(["compatibility", "predation", "territorial"] as const)(
    "keeps one %s warning healthy",
    (category) => {
      const result = deriveAquariumBuildHealth({
        build: build(),
        stocking: stocking(),
        validation: report([issue("RISK", "warning", category)]),
      });

      expect(result.status).toBe("healthy");
      expect(result.reasons[0].code).toBe("VALIDATION_WARNING");
    },
  );

  it("treats two warnings as needs attention", () => {
    const result = deriveAquariumBuildHealth({
      build: build(),
      stocking: stocking(),
      validation: report([
        issue("HEATER_INACTIVE", "warning", "heating"),
        issue("STOCKING_FULL", "warning", "stocking"),
      ]),
    });

    expect(result.status).toBe("needs-attention");
    expect(result.reasons[0].code).toBe("MULTIPLE_WARNINGS");
  });

  it("treats three warnings as high risk", () => {
    const result = deriveAquariumBuildHealth({
      build: build(),
      stocking: stocking(),
      validation: report([
        issue("HEATER_INACTIVE", "warning", "heating"),
        issue("STOCKING_FULL", "warning", "stocking"),
        issue("SCHOOL_SIZE_BELOW_MINIMUM", "warning", "school_size"),
      ]),
    });

    expect(result.status).toBe("high-risk");
    expect(result.reasons[0].code).toBe("MULTIPLE_WARNINGS");
  });

  it("keeps a build with one warning healthy", () => {
    const result = deriveAquariumBuildHealth({
      build: build(),
      stocking: stocking(),
      validation: report([
        issue("HEATER_SPECIFICATION_MISSING", "warning", "heating"),
      ]),
    });

    expect(result.status).toBe("healthy");
    expect(result.label).toBe("Healthy");
    expect(result.reasons[0].code).toBe("VALIDATION_WARNING");
  });

  it.each([
    { selectedBuild: build({ tankGallons: 0 }), completeStocking: true },
    { selectedBuild: build({ livestock: false }), completeStocking: true },
    { selectedBuild: build(), completeStocking: false },
  ])("does not rate partial analysis healthy", ({ selectedBuild, completeStocking }) => {
    const result = deriveAquariumBuildHealth({
      build: selectedBuild,
      stocking: stocking(completeStocking),
      validation: report(),
    });

    expect(result.status).toBe("needs-attention");
    expect(result.reasons[0].code).toBe("INCOMPLETE_ANALYSIS");
  });

  it("treats incomplete-data findings as needs attention", () => {
    const result = deriveAquariumBuildHealth({
      build: build(),
      stocking: stocking(),
      validation: report([
        issue("HEATING_REQUIREMENT_UNAVAILABLE", "info", "heating"),
      ]),
    });

    expect(result.status).toBe("needs-attention");
  });

  it("allows non-blocking informational guidance to remain healthy", () => {
    const result = deriveAquariumBuildHealth({
      build: build(),
      stocking: stocking(),
      validation: report([
        issue("HEATER_MAY_BE_UNNECESSARY", "info", "heating"),
      ]),
    });

    expect(result).toMatchObject({ status: "healthy", label: "Healthy" });
  });

  it("requires a filter and a completely clear report for excellent", () => {
    const healthy = deriveAquariumBuildHealth({
      build: build({ filter: false }),
      stocking: stocking(),
      validation: report(),
    });
    const excellent = deriveAquariumBuildHealth({
      build: build(),
      stocking: stocking(),
      validation: report(),
    });

    expect(healthy.status).toBe("healthy");
    expect(healthy.reasons[0].code).toBe("CORE_EQUIPMENT_INCOMPLETE");
    expect(excellent).toMatchObject({
      status: "excellent",
      label: "Excellent",
    });
  });

  it("is deterministic", () => {
    const input = {
      build: build(),
      stocking: stocking(),
      validation: report(),
    };

    expect(deriveAquariumBuildHealth(input)).toEqual(
      deriveAquariumBuildHealth(input),
    );
  });
});

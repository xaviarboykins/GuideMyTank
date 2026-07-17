import { describe, expect, it, vi } from "vitest";

import type { AquariumBuild } from "@/lib/aquarium-builder/types";

import { validateAquarium } from "./engine";
import { createValidationIssue } from "./issues";
import type { AquariumValidator } from "./types";

function build(overrides: Partial<AquariumBuild> = {}): AquariumBuild {
  return {
    tank: {
      sizeGallons: 20,
      filtrationLevel: "standard",
      plantedLevel: "none",
    },
    livestock: [],
    plants: [],
    equipment: [],
    ...overrides,
  };
}

function validator(
  name: string,
  severity: "info" | "warning" | "error",
): AquariumValidator {
  return {
    name,
    async validate() {
      return [
        createValidationIssue({
          code: name,
          category: "compatibility",
          severity,
          title: name,
          message: `${name} message`,
          affectedSpeciesIds: [],
        }),
      ];
    },
  };
}

describe("validateAquarium foundation", () => {
  it("returns a valid empty report with the empty registry", async () => {
    const report = await validateAquarium(build(), {
      now: () => new Date("2026-07-16T12:00:00.000Z"),
    });

    expect(report).toEqual({
      valid: true,
      issues: [],
      summary: {
        infoCount: 0,
        warningCount: 0,
        errorCount: 0,
        totalCount: 0,
      },
      evaluatedAt: "2026-07-16T12:00:00.000Z",
    });
  });

  it("is invalid only when at least one error exists", async () => {
    const warningReport = await validateAquarium(build(), {
      validators: [validator("WARNING", "warning")],
    });
    const errorReport = await validateAquarium(build(), {
      validators: [
        validator("INFO", "info"),
        validator("ERROR", "error"),
      ],
    });

    expect(warningReport.valid).toBe(true);
    expect(errorReport.valid).toBe(false);
    expect(errorReport.summary).toMatchObject({
      errorCount: 1,
      infoCount: 1,
      totalCount: 2,
    });
  });

  it("combines, deduplicates, and sorts mocked validator findings", async () => {
    const duplicate = validator("DUPLICATE", "warning");
    const report = await validateAquarium(build(), {
      validators: [
        validator("INFO", "info"),
        duplicate,
        duplicate,
        validator("ERROR", "error"),
      ],
    });

    expect(report.issues.map((issue) => issue.code)).toEqual([
      "ERROR",
      "DUPLICATE",
      "INFO",
    ]);
  });

  it("continues after a validator fails without exposing its error", async () => {
    const onValidatorError = vi.fn();
    const failingValidator: AquariumValidator = {
      name: "failing",
      async validate() {
        throw new Error("internal database detail");
      },
    };
    const report = await validateAquarium(build(), {
      validators: [failingValidator, validator("SUPPORTED", "warning")],
      onValidatorError,
    });

    expect(report.issues.map((issue) => issue.code)).toEqual(["SUPPORTED"]);
    expect(onValidatorError).toHaveBeenCalledWith("failing", expect.any(Error));
    expect(JSON.stringify(report)).not.toContain("internal database detail");
  });

  it("normalizes missing arrays for partial runtime input", async () => {
    const inspectContext: AquariumValidator = {
      name: "inspect-context",
      async validate(context) {
        expect(context.input.livestock).toEqual([]);
        expect(context.input.plants).toEqual([]);
        expect(context.input.equipment).toEqual([]);
        return [];
      },
    };

    await expect(
      validateAquarium({ tank: build().tank } as AquariumBuild, {
        validators: [inspectContext],
      }),
    ).resolves.toMatchObject({ valid: true, issues: [] });
  });
});

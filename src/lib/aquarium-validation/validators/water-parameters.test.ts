import { describe, expect, it } from "vitest";

import type {
  AquariumBuild,
  AquariumResolvedLivestockEntry,
  AquariumSpecies,
} from "@/lib/aquarium-builder/types";

import { AQUARIUM_VALIDATION_CODES } from "../constants";
import type { AquariumValidatorContext } from "../types";
import {
  WATER_PARAMETER_NARROW_OVERLAP_THRESHOLDS,
  waterParameterValidator,
} from "./water-parameters";

const build: AquariumBuild = {
  tank: {
    sizeGallons: 20,
    filtrationLevel: "standard",
    plantedLevel: "none",
  },
  livestock: [],
  plants: [],
  equipment: [],
};

function livestock(
  id: string,
  overrides: Partial<AquariumSpecies> = {},
): AquariumResolvedLivestockEntry {
  return {
    speciesSlug: `slug-${id}`,
    quantity: 1,
    species: {
      id,
      slug: `slug-${id}`,
      common_name: `Species ${id}`,
      min_temp_f: 70,
      max_temp_f: 80,
      min_ph: 6,
      max_ph: 8,
      min_gh_dgh: null,
      max_gh_dgh: null,
      min_kh_dkh: null,
      max_kh_dkh: null,
      ...overrides,
    } as AquariumSpecies,
  };
}

function context(
  species: AquariumResolvedLivestockEntry[],
): AquariumValidatorContext {
  return {
    input: build,
    species,
    speciesPairs: [],
    compatibilityResults: [],
    stockingAnalysis: null,
  };
}

async function codes(species: AquariumResolvedLivestockEntry[]) {
  return (await waterParameterValidator.validate(context(species))).map(
    (issue) => issue.code,
  );
}

describe("waterParameterValidator", () => {
  it("defines named narrow-overlap thresholds", () => {
    expect(WATER_PARAMETER_NARROW_OVERLAP_THRESHOLDS).toEqual({
      temperatureFahrenheit: 4,
      ph: 0.5,
    });
  });

  it("returns no issue for empty, one-species, or broadly overlapping builds", async () => {
    await expect(waterParameterValidator.validate(context([]))).resolves.toEqual(
      [],
    );
    await expect(
      waterParameterValidator.validate(context([livestock("a")])),
    ).resolves.toEqual([]);
    await expect(
      waterParameterValidator.validate(
        context([
          livestock("a"),
          livestock("b", {
            min_temp_f: 72,
            max_temp_f: 78,
            min_ph: 6.5,
            max_ph: 7.5,
          }),
        ]),
      ),
    ).resolves.toEqual([]);
  });

  it("returns an error when temperature ranges do not overlap", async () => {
    const issues = await waterParameterValidator.validate(
      context([
        livestock("cold", { min_temp_f: 60, max_temp_f: 68 }),
        livestock("warm", { min_temp_f: 75, max_temp_f: 82 }),
      ]),
    );
    const issue = issues.find(
      (item) =>
        item.code === AQUARIUM_VALIDATION_CODES.waterTemperatureNoOverlap,
    );

    expect(issue).toMatchObject({
      severity: "error",
      affectedSpeciesIds: ["cold", "warm"],
      metadata: {
        parameter: "temperature",
        sharedMinimum: 75,
        sharedMaximum: 68,
      },
    });
  });

  it("returns an error when pH ranges do not overlap", async () => {
    expect(
      await codes([
        livestock("acid", { min_ph: 5, max_ph: 6 }),
        livestock("alkaline", { min_ph: 7.5, max_ph: 8.5 }),
      ]),
    ).toContain(AQUARIUM_VALIDATION_CODES.waterPhNoOverlap);
  });

  it("validates GH when enough complete data exists", async () => {
    expect(
      await codes([
        livestock("soft", { min_gh_dgh: 1, max_gh_dgh: 4 }),
        livestock("hard", { min_gh_dgh: 8, max_gh_dgh: 12 }),
      ]),
    ).toContain(AQUARIUM_VALIDATION_CODES.waterGhNoOverlap);
  });

  it("validates KH when enough complete data exists", async () => {
    expect(
      await codes([
        livestock("low", { min_kh_dkh: 1, max_kh_dkh: 3 }),
        livestock("high", { min_kh_dkh: 5, max_kh_dkh: 8 }),
      ]),
    ).toContain(AQUARIUM_VALIDATION_CODES.waterKhNoOverlap);
  });

  it("treats exact boundary overlap as narrow rather than incompatible", async () => {
    const issueCodes = await codes([
      livestock("a", { min_temp_f: 70, max_temp_f: 75 }),
      livestock("b", { min_temp_f: 75, max_temp_f: 80 }),
    ]);

    expect(issueCodes).toContain(
      AQUARIUM_VALIDATION_CODES.waterTemperatureNarrowOverlap,
    );
    expect(issueCodes).not.toContain(
      AQUARIUM_VALIDATION_CODES.waterTemperatureNoOverlap,
    );
  });

  it("warns for a narrow pH overlap at the named threshold", async () => {
    const issues = await waterParameterValidator.validate(
      context([
        livestock("a", { min_ph: 6, max_ph: 7 }),
        livestock("b", { min_ph: 6.5, max_ph: 8 }),
      ]),
    );
    const issue = issues.find(
      (item) => item.code === AQUARIUM_VALIDATION_CODES.waterPhNarrowOverlap,
    );

    expect(issue).toMatchObject({
      severity: "warning",
      metadata: {
        sharedMinimum: 6.5,
        sharedMaximum: 7,
        overlapWidth: 0.5,
        narrowThreshold: 0.5,
      },
    });
  });

  it("does not treat missing optional GH and KH as incompatibility", async () => {
    const issueCodes = await codes([livestock("a"), livestock("b")]);

    expect(issueCodes).not.toContain(
      AQUARIUM_VALIDATION_CODES.waterGhNoOverlap,
    );
    expect(issueCodes).not.toContain(
      AQUARIUM_VALIDATION_CODES.waterKhNoOverlap,
    );
    expect(issueCodes).not.toContain(
      AQUARIUM_VALIDATION_CODES.waterParameterDataIncomplete,
    );
  });

  it("returns one useful info finding for incomplete temperature or pH data", async () => {
    const issues = await waterParameterValidator.validate(
      context([
        livestock("complete"),
        livestock("missing", {
          min_temp_f: null,
          max_temp_f: null,
          min_ph: null,
          max_ph: null,
        }),
      ]),
    );

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      code: AQUARIUM_VALIDATION_CODES.waterParameterDataIncomplete,
      severity: "info",
      affectedSpeciesIds: ["missing"],
      metadata: { incompleteParameters: ["ph", "temperature"] },
    });
  });

  it("continues supported checks when a third species has incomplete data", async () => {
    const issueCodes = await codes([
      livestock("cold", { min_temp_f: 60, max_temp_f: 68 }),
      livestock("warm", { min_temp_f: 75, max_temp_f: 82 }),
      livestock("unknown", { min_temp_f: null, max_temp_f: null }),
    ]);

    expect(issueCodes).toContain(
      AQUARIUM_VALIDATION_CODES.waterTemperatureNoOverlap,
    );
    expect(issueCodes).toContain(
      AQUARIUM_VALIDATION_CODES.waterParameterDataIncomplete,
    );
  });

  it("treats reversed or non-finite required ranges as incomplete", async () => {
    const issueCodes = await codes([
      livestock("complete"),
      livestock("invalid", {
        min_temp_f: 80,
        max_temp_f: 70,
        min_ph: Number.NaN,
        max_ph: 8,
      }),
    ]);

    expect(issueCodes).toEqual([
      AQUARIUM_VALIDATION_CODES.waterParameterDataIncomplete,
    ]);
  });

  it("deduplicates repeated species before range intersection", async () => {
    const issueCodes = await codes([
      livestock("a", { min_temp_f: 70, max_temp_f: 75 }),
      livestock("a", { min_temp_f: 70, max_temp_f: 75 }),
      livestock("b", { min_temp_f: 75, max_temp_f: 80 }),
    ]);

    expect(
      issueCodes.filter(
        (code) =>
          code ===
          AQUARIUM_VALIDATION_CODES.waterTemperatureNarrowOverlap,
      ),
    ).toHaveLength(1);
  });
});

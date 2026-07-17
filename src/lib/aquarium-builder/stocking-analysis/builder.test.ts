import { describe, expect, it } from "vitest";

import type { AquariumBuild } from "@/lib/aquarium-builder/types";

import {
  deriveAquariumFiltrationLevel,
  deriveAquariumPlantedLevel,
  normalizeStockingAnalysisInput,
} from "./builder";

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

function buildWithFilter(flowRateGph: number, tankGallons = 20) {
  return build({
    tank: {
      sizeGallons: tankGallons,
      filtrationLevel: "standard",
      plantedLevel: "none",
    },
    equipment: [
      {
        name: "Test filter",
        category: "filter",
        quantity: 1,
        estimatedPrice: 0,
        flowRateGph,
      },
    ],
  });
}

describe("builder stocking normalization", () => {
  describe("filtration derivation", () => {
    it("uses low filtration when no filter is selected", () => {
      expect(deriveAquariumFiltrationLevel(build())).toBe("low");
    });

    it("uses low filtration below five turnovers per hour", () => {
      expect(deriveAquariumFiltrationLevel(buildWithFilter(99))).toBe("low");
    });

    it("uses standard filtration from five turnovers per hour", () => {
      expect(deriveAquariumFiltrationLevel(buildWithFilter(100))).toBe(
        "standard",
      );
    });

    it("uses high filtration from eight turnovers per hour", () => {
      expect(deriveAquariumFiltrationLevel(buildWithFilter(160))).toBe("high");
    });

    it("does not derive turnover without an exact positive tank size", () => {
      expect(deriveAquariumFiltrationLevel(buildWithFilter(160, 0))).toBe(
        "low",
      );
    });
  });

  describe("planted-level derivation", () => {
    it("uses none without selected plants", () => {
      expect(deriveAquariumPlantedLevel(build())).toBe("none");
    });

    it("derives light planting below 0.25 plants per gallon", () => {
      expect(
        deriveAquariumPlantedLevel(
          build({ plants: [{ plantSlug: "anubias", quantity: 4 }] }),
        ),
      ).toBe("light");
    });

    it("derives moderate planting from 0.25 plants per gallon", () => {
      expect(
        deriveAquariumPlantedLevel(
          build({ plants: [{ plantSlug: "anubias", quantity: 5 }] }),
        ),
      ).toBe("moderate");
    });

    it("derives heavy planting from 0.5 plants per gallon", () => {
      expect(
        deriveAquariumPlantedLevel(
          build({ plants: [{ plantSlug: "anubias", quantity: 10 }] }),
        ),
      ).toBe("heavy");
    });

    it("preserves an explicit planted level", () => {
      expect(
        deriveAquariumPlantedLevel(
          build({
            tank: {
              sizeGallons: 20,
              filtrationLevel: "standard",
              plantedLevel: "heavy",
            },
            plants: [{ plantSlug: "anubias", quantity: 1 }],
          }),
        ),
      ).toBe("heavy");
    });
  });

  it("passes derived levels into the engine input", () => {
    const normalized = normalizeStockingAnalysisInput(
      build({
        equipment: buildWithFilter(160).equipment,
        plants: [{ plantSlug: "anubias", quantity: 5 }],
      }),
      [],
    );

    expect(normalized.filtrationLevel).toBe("high");
    expect(normalized.plantedLevel).toBe("moderate");
  });
});

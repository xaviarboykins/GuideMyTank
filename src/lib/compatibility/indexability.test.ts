import { describe, expect, it } from "vitest";

import { getCompatibilityIndexability } from "./indexability";

describe("compatibility indexability", () => {
  it("indexes expert-reviewed reports even when source coverage is still being expanded", () => {
    expect(
      getCompatibilityIndexability({
        dataConfidence: "limited",
        expertValidated: true,
        sourcedSpeciesCount: 0,
        reviewedResult: false,
      }),
    ).toEqual({ indexable: true, reason: "expert-reviewed" });
  });

  it("indexes computed reports only when both species are sourced", () => {
    expect(
      getCompatibilityIndexability({
        dataConfidence: "moderate",
        expertValidated: false,
        sourcedSpeciesCount: 2,
        reviewedResult: false,
      }),
    ).toEqual({ indexable: true, reason: "supported-computed-report" });
  });

  it("keeps limited-confidence computed reports out of the index", () => {
    expect(
      getCompatibilityIndexability({
        dataConfidence: "limited",
        expertValidated: false,
        sourcedSpeciesCount: 2,
        reviewedResult: false,
      }),
    ).toEqual({ indexable: false, reason: "limited-data-confidence" });
  });

  it("requires source coverage for both species", () => {
    expect(
      getCompatibilityIndexability({
        dataConfidence: "high",
        expertValidated: false,
        sourcedSpeciesCount: 1,
        reviewedResult: false,
      }),
    ).toEqual({ indexable: false, reason: "incomplete-source-coverage" });
  });

  it("indexes manually reviewed regression pairs", () => {
    expect(
      getCompatibilityIndexability({
        dataConfidence: "limited",
        expertValidated: false,
        sourcedSpeciesCount: 0,
        reviewedResult: true,
      }),
    ).toEqual({ indexable: true, reason: "reviewed-regression" });
  });
});

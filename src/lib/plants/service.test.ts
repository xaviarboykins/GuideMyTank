import { describe, expect, it } from "vitest";

import {
  buildPlantSearchFilter,
  normalizePlantSearchQuery,
} from "./service";

describe("plant search", () => {
  it("searches common and scientific names", () => {
    expect(buildPlantSearchFilter("anubias")).toBe(
      "common_name.ilike.%anubias%,scientific_name.ilike.%anubias%",
    );
  });

  it("preserves meaningful spaces in scientific names", () => {
    expect(buildPlantSearchFilter("  Anubias   barteri  ")).toBe(
      "common_name.ilike.%Anubias barteri%,scientific_name.ilike.%Anubias barteri%",
    );
  });

  it("removes PostgREST filter syntax characters", () => {
    expect(normalizePlantSearchQuery("fern,()._%java")).toBe("fern java");
  });

  it("does not add a search filter for an empty query", () => {
    expect(buildPlantSearchFilter("  ,()  ")).toBeNull();
  });
});

import { describe, expect, it } from "vitest";

import {
  MAX_RELATED_COMPATIBILITY_REPORTS,
  MAX_SHARED_SPECIES_REPORTS,
} from "./constants";
import { getRelatedCompatibilityReports } from "./related-compatibility";
import type {
  CompatibilityReportCandidate,
  CompatibilityReportSpecies,
} from "./types";

function species(slug: string, name = slug): CompatibilityReportSpecies {
  return { entityId: slug, slug, name };
}

function report(
  speciesA: string,
  speciesB: string,
  options: Partial<CompatibilityReportCandidate> = {},
): CompatibilityReportCandidate {
  return {
    speciesA: species(speciesA),
    speciesB: species(speciesB),
    ...options,
  };
}

describe("related compatibility report selection", () => {
  it("selects reports sharing either current species", () => {
    const current = report("betta-splendens", "neon-tetra");
    const links = getRelatedCompatibilityReports(current, [
      report("betta-splendens", "ember-tetra"),
      report("cardinal-tetra", "neon-tetra"),
      report("guppy", "zebra-danio"),
    ]);

    expect(links.map((link) => link.href)).toEqual([
      "/compatibility/betta-splendens/ember-tetra",
      "/compatibility/cardinal-tetra/neon-tetra",
    ]);
  });

  it("excludes the current pair in either order", () => {
    const current = report("betta-splendens", "neon-tetra");
    const links = getRelatedCompatibilityReports(current, [
      report("betta-splendens", "neon-tetra"),
      report("neon-tetra", "betta-splendens"),
    ]);

    expect(links).toEqual([]);
  });

  it("deduplicates reversed candidate pairs to one canonical URL", () => {
    const links = getRelatedCompatibilityReports(
      report("betta-splendens", "neon-tetra"),
      [
        report("betta-splendens", "ember-tetra", { score: 80 }),
        report("ember-tetra", "betta-splendens", { score: 90 }),
      ],
    );

    expect(links).toHaveLength(1);
    expect(links[0].href).toBe(
      "/compatibility/betta-splendens/ember-tetra",
    );
    expect(links[0].score).toBe(90);
  });

  it("excludes draft, archived, unrelated, and invalid reports", () => {
    const current = report("betta-splendens", "neon-tetra");
    const links = getRelatedCompatibilityReports(current, [
      report("betta-splendens", "draft-fish", {
        availability: "draft",
      }),
      report("neon-tetra", "archived-fish", {
        availability: "archived",
      }),
      report("guppy", "molly"),
      report("betta-splendens", "Invalid Slug"),
      report("betta-splendens", "valid-fish"),
    ]);

    expect(links.map((link) => link.href)).toEqual([
      "/compatibility/betta-splendens/valid-fish",
    ]);
  });

  it("enforces per-species and overall limits", () => {
    const current = report("betta-splendens", "neon-tetra");
    const candidates = [
      ...Array.from(
        { length: MAX_SHARED_SPECIES_REPORTS + 3 },
        (_, index) =>
          report("betta-splendens", `betta-match-${index}`, {
            score: 100 - index,
          }),
      ),
      ...Array.from(
        { length: MAX_SHARED_SPECIES_REPORTS + 3 },
        (_, index) =>
          report("neon-tetra", `neon-match-${index}`, {
            score: 90 - index,
          }),
      ),
    ];
    const links = getRelatedCompatibilityReports(current, candidates);

    expect(links).toHaveLength(MAX_RELATED_COMPATIBILITY_REPORTS);
    expect(
      links.filter((link) => link.href.includes("betta-splendens")),
    ).toHaveLength(MAX_SHARED_SPECIES_REPORTS);
  });

  it("supports lower configured limits and stable score ordering", () => {
    const links = getRelatedCompatibilityReports(
      report("betta-splendens", "neon-tetra"),
      [
        report("betta-splendens", "zebra-danio", { score: 70 }),
        report("betta-splendens", "ember-tetra", { score: 90 }),
        report("neon-tetra", "cardinal-tetra", { score: 80 }),
      ],
      { limit: 2, sharedSpeciesLimit: 2 },
    );

    expect(links.map((link) => link.score)).toEqual([90, 80]);
  });
});

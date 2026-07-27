import { describe, expect, it } from "vitest";

import { detectGuideSearchConflicts } from "./search-conflicts";

const subject = {
  id: "current",
  title: "Best Betta Tank Mates",
  slug: "best-betta-tank-mates",
  normalizedSearchIntent: "best betta tank mates",
  generationKey: "tank-mates:betta",
  guideFamily: "tank_mates",
  guideType: "tank-mates",
  sourceEntityKeys: ["species:betta"],
};

describe("Guide search-conflict detection", () => {
  it("blocks exact generation-key and search-intent duplicates", () => {
    const result = detectGuideSearchConflicts(subject, [
      {
        id: "other",
        contentType: "guide",
        title: "Betta Companions",
        slug: "betta-companions",
        generationKey: "tank-mates:betta",
        normalizedSearchIntent: "best betta tank mates",
        guideFamily: "tank_mates",
        guideType: "tank-mates",
        sourceEntityKeys: ["species:betta"],
      },
    ]);

    expect(result.errors.map((item) => item.code)).toEqual(
      expect.arrayContaining([
        "duplicate",
      ]),
    );
  });

  it("blocks matching family/source identities even with a bad legacy key", () => {
    const result = detectGuideSearchConflicts(subject, [
      {
        id: "other",
        contentType: "guide",
        title: "Betta Friends",
        slug: "betta-friends",
        generationKey: "legacy:betta",
        normalizedSearchIntent: "betta friends",
        guideFamily: "tank_mates",
        guideType: "tank-mates",
        sourceEntityKeys: ["species:betta"],
      },
    ]);

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "duplicate_source_identity" }),
      ]),
    );
  });

  it("warns about cross-type title and slug overlap", () => {
    const result = detectGuideSearchConflicts(subject, [
      {
        id: "article",
        contentType: "article",
        title: "Best Betta Tank Mates",
        slug: "best-betta-tank-mates",
      },
    ]);

    expect(result.errors).toHaveLength(0);
    expect(result.warnings.map((item) => item.code)).toEqual(
      expect.arrayContaining([
        "cross_type_slug_overlap",
        "potential_search_overlap",
      ]),
    );
  });

  it("ignores the current Guide", () => {
    expect(
      detectGuideSearchConflicts(subject, [
        {
          id: "current",
          contentType: "guide",
          title: subject.title,
          slug: subject.slug,
          generationKey: subject.generationKey,
          normalizedSearchIntent: subject.normalizedSearchIntent,
        },
      ]),
    ).toEqual({ errors: [], warnings: [] });
  });
});

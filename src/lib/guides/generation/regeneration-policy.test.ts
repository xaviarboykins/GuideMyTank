import { describe, expect, it } from "vitest";

import { decideGuideDraftRegeneration } from "./regeneration-policy";

const unchangedDraft = {
  status: "draft",
  manualEditsDetected: false,
  generatedContentHash: "same",
  persistedContentHash: "same",
};

describe("Guide Draft regeneration policy", () => {
  it("allows an unchanged generated Draft", () => {
    expect(decideGuideDraftRegeneration(unchangedDraft)).toEqual({
      allowed: true,
    });
  });

  it("refuses a manually changed Draft", () => {
    expect(
      decideGuideDraftRegeneration({
        ...unchangedDraft,
        persistedContentHash: "editorial-change",
      }),
    ).toMatchObject({ allowed: false });
  });

  it("refuses an explicitly protected Draft", () => {
    expect(
      decideGuideDraftRegeneration({
        ...unchangedDraft,
        manualEditsDetected: true,
      }),
    ).toMatchObject({ allowed: false });
  });

  it.each(["published", "archived"])(
    "refuses in-place regeneration for %s Guides",
    (status) => {
      expect(
        decideGuideDraftRegeneration({ ...unchangedDraft, status }),
      ).toMatchObject({ allowed: false });
    },
  );
});


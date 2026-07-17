import { describe, expect, it } from "vitest";

import { REQUIRED_CARE_GUIDE_SECTIONS, REQUIRED_QUICK_FACTS, validateCareGuideForPublication } from "./validation";

function validGuide() {
  const speciesId = "species-1";
  return {
    speciesId,
    title: "Betta Care Guide",
    slug: "betta-care-guide",
    summary: "Practical Betta care information.",
    quickFacts: Object.fromEntries(REQUIRED_QUICK_FACTS.map((fact) => [fact, "complete"])),
    sections: REQUIRED_CARE_GUIDE_SECTIONS.map((sectionType) => ({ sectionType, content: { text: "Complete" } })),
    images: [
      { imageId: "image-1", speciesId, isPrimary: true, altText: "Blue Betta" },
      { imageId: "image-2", speciesId, isPrimary: false, altText: "Red Betta" },
    ],
    sourceCount: 1,
    slugAvailable: true,
  };
}

describe("Care Guide publication validation", () => {
  it("accepts a complete Care Guide", () => {
    expect(validateCareGuideForPublication(validGuide())).toEqual({ valid: true, issues: [] });
  });

  it("allows incomplete drafts by applying rules only when publishing", () => {
    const result = validateCareGuideForPublication({ ...validGuide(), title: null, sections: [], images: [] });
    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "title" }),
      expect.objectContaining({ field: "images" }),
      expect.objectContaining({ field: "sections.overview" }),
    ]));
  });

  it("requires two uploaded images and one primary image", () => {
    const guide = validGuide();
    guide.images = [guide.images[0]];
    const result = validateCareGuideForPublication(guide);
    expect(result.issues).toEqual(expect.arrayContaining([expect.objectContaining({ field: "images", code: "minimum" })]));
  });
});


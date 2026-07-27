import { describe, expect, it } from "vitest";

import type { GuidePublicationValidationInput } from "./types";
import { validateGuideForPublication } from "./publication";

function validInput(): GuidePublicationValidationInput {
  return {
    id: "guide",
    title: "Betta vs Honey Gourami",
    slug: "betta-vs-honey-gourami",
    summary: "A structured comparison.",
    seoTitle: "Betta vs Honey Gourami",
    metaDescription: "Compare structured aquarium requirements.",
    canonicalUrl: null,
    sections: [
      { blockType: "paragraph", content: { text: "Introduction." } },
      {
        blockType: "heading",
        content: { text: "Side-by-side comparison", level: 2 },
      },
      {
        blockType: "comparison_table",
        content: {
          headers: ["Requirement", "Betta", "Gourami"],
          rows: [["Tank", "10 gallons", "20 gallons"]],
        },
      },
      {
        blockType: "warning",
        content: { text: "Validate the complete aquarium." },
      },
      {
        blockType: "faq_group",
        content: {
          items: [{ question: "Can they live together?", answer: "Review the complete setup." }],
        },
      },
    ],
    metadata: {
      guideFamily: "species_comparison",
      guideType: "comparison",
      generationKey: "comparison:betta-honey-gourami",
      generationMetadata: {
        speciesIds: ["betta", "honey-gourami"],
        internalLinks: [
          { type: "species", href: "/species/betta-splendens" },
        ],
        sourceReferences: [
          { title: "Source", url: "https://example.org/source" },
        ],
      },
      primarySearchIntent: "Betta vs Honey Gourami",
      normalizedSearchIntent: "betta vs honey gourami",
      searchIntentConflictStatus: "none",
      sourceDataFingerprint: "fingerprint",
      generatedContentHash: "hash",
      currentContentHash: "hash",
      manualEditsDetected: false,
    },
    generationKeyUnique: true,
    normalizedSearchIntentUnique: true,
    slugUnique: true,
    canonicalUrlUnique: true,
  };
}

describe("Guide publication validation", () => {
  it("accepts a complete Guide", () => {
    expect(validateGuideForPublication(validInput())).toEqual({
      valid: true,
      errors: [],
      warnings: [],
    });
  });

  it("blocks missing SEO, source tracking, and required structure", () => {
    const input = validInput();
    input.seoTitle = null;
    input.metadata.sourceDataFingerprint = null;
    input.sections = [];

    const result = validateGuideForPublication(input);
    expect(result.valid).toBe(false);
    expect(result.errors.map((item) => item.code)).toEqual(
      expect.arrayContaining(["required", "minimum"]),
    );
  });

  it("blocks exact conflicts and preserves potential overlap as warnings", () => {
    const input = validInput();
    input.metadata.searchIntentConflictStatus = "exact";
    input.conflictWarnings = [
      {
        field: "title",
        code: "potential_search_overlap",
        message: "Review matching Article.",
      },
    ];

    const result = validateGuideForPublication(input);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "unresolved" }),
      ]),
    );
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "potential_search_overlap" }),
      ]),
    );
  });

  it("warns rather than blocks when manual edits are detected", () => {
    const input = validInput();
    input.metadata.manualEditsDetected = true;

    const result = validateGuideForPublication(input);
    expect(result.valid).toBe(true);
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "manualEditsDetected" }),
      ]),
    );
  });
});


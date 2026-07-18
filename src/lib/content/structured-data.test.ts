import { describe, expect, it } from "vitest";

import { validateArticleBlockContent, validateCareGuideSectionContent } from "./structured-data";

describe("structured content validation", () => {
  it("requires text in Care Guide sections", () => {
    expect(validateCareGuideSectionContent("overview", { text: "Useful overview" }).valid).toBe(true);
    expect(validateCareGuideSectionContent("overview", { text: " " }).valid).toBe(false);
  });

  it("validates controlled article block shapes", () => {
    expect(validateArticleBlockContent("heading", { text: "Setup", level: 2 }).valid).toBe(true);
    expect(validateArticleBlockContent("list", { items: ["Tank", "Filter"] }).valid).toBe(true);
    expect(validateArticleBlockContent("comparison_table", {
      headers: ["Option", "Use"],
      rows: [["Sponge filter", "Gentle flow"]],
    }).valid).toBe(true);
    expect(validateArticleBlockContent("comparison_table", {
      headers: ["Option", "Use"],
      rows: [["Incomplete"]],
    }).valid).toBe(false);
  });

  it("rejects arbitrary article block types", () => {
    expect(validateArticleBlockContent("script", { text: "alert(1)" }).valid).toBe(false);
  });
});


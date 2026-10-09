import { describe, expect, it } from "vitest";

import { buildCareGuideChapters } from "./chapters";

describe("Care Guide chapters", () => {
  it("groups fragmented template sections into readable chapters", () => {
    const chapters = buildCareGuideChapters([
      { id: "1", section_type: "overview", heading: "Overview", content: { text: "Overview" } },
      { id: "2", section_type: "water_parameters", heading: "Water", content: { text: "Water" } },
      { id: "3", section_type: "filtration_and_flow", heading: "Flow", content: { text: "Flow" } },
    ]);

    expect(chapters.map((chapter) => chapter.title)).toEqual([
      "Understanding the species",
      "Aquarium setup and water conditions",
    ]);
    expect(chapters[1].sections.map((section) => section.section_type)).toEqual([
      "water_parameters",
      "filtration_and_flow",
    ]);
  });

  it("keeps custom editorial sections in species-specific guidance", () => {
    const chapters = buildCareGuideChapters([
      { id: "1", section_type: "custom_shyness", heading: "Troubleshooting shyness", content: { text: "Use cover." } },
    ]);

    expect(chapters[0]).toMatchObject({
      id: "species-specific-guidance",
      sections: [expect.objectContaining({ section_type: "custom_shyness" })],
    });
  });
});

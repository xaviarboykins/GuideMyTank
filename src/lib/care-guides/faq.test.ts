import { describe, expect, it } from "vitest";

import {
  formatCareGuideFaqForEditing,
  getCareGuideFaqItems,
  parseLegacyCareGuideFaq,
} from "./faq";

describe("Care Guide FAQs", () => {
  it("parses legacy paragraphs without merging an answer into the next question", () => {
    const text = "How many should be kept together?\r\nKeep at least 8 individuals.\r\n\r\nDo they need a heater?\r\nNot always.";

    expect(parseLegacyCareGuideFaq(text)).toEqual([
      { question: "How many should be kept together?", answer: "Keep at least 8 individuals." },
      { question: "Do they need a heater?", answer: "Not always." },
    ]);
  });

  it("supports the older inline FAQ format", () => {
    const text = "Can a betta live in a bowl? A bowl is unsuitable. Does a betta need a heater? Usually yes.";

    expect(parseLegacyCareGuideFaq(text)).toEqual([
      { question: "Can a betta live in a bowl?", answer: "A bowl is unsuitable." },
      { question: "Does a betta need a heater?", answer: "Usually yes." },
    ]);
  });

  it("prefers structured items and formats them for the editor", () => {
    const content = {
      items: [{ question: "What should I test?", answer: "Test ammonia and nitrite." }],
    };

    expect(getCareGuideFaqItems(content)).toHaveLength(1);
    expect(formatCareGuideFaqForEditing(content)).toBe(
      "What should I test?\nTest ammonia and nitrite.",
    );
  });
});

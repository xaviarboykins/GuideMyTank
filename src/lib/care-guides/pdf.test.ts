import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { createCareGuidePdf } from "./pdf";

describe("createCareGuidePdf", () => {
  it("creates a readable, multipage Care Guide PDF with metadata", async () => {
    const bytes = await createCareGuidePdf({ title: "Betta Care Guide", slug: "betta-splendens", summary: "A practical guide to long-term betta care.", quick_facts: { minimum_tank_size: "5 gallons", temperature_range: "78-80 F" }, published_at: "2026-07-01T00:00:00.000Z", updated_at: "2026-07-17T00:00:00.000Z", species: { common_name: "Betta", scientific_name: "Betta splendens" } }, Array.from({ length: 16 }, (_, index) => ({ heading: `Care section ${index + 1}`, section_type: `section_${index + 1}`, content: { text: "Maintain stable water conditions and observe the fish daily. ".repeat(14) } })), [{ sources: { title: "Aquarium husbandry reference", url: "https://example.com/reference", author: "A. Expert", publisher: "Example Publisher" } }], { bytes: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl1sAAAAASUVORK5CYII=", "base64"), caption: "Primary Care Guide image" });
    expect(Buffer.from(bytes).subarray(0, 5).toString()).toBe("%PDF-");
    const document = await PDFDocument.load(bytes);
    expect(document.getPageCount()).toBeGreaterThan(1);
    expect(document.getTitle()).toBe("Betta Care Guide");
    expect(document.getAuthor()).toBe("GuideMyTank Editorial Team");
  });
});

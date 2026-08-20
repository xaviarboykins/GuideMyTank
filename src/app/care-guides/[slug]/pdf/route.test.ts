import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createCareGuidePdf: vi.fn(),
  createPublishedContentImageFetchUrl: vi.fn(),
  getPublishedCareGuideBySlug: vi.fn(),
  sharp: vi.fn(),
}));

vi.mock("@/lib/care-guides/service", () => ({
  getPublishedCareGuideBySlug: mocks.getPublishedCareGuideBySlug,
}));
vi.mock("@/lib/care-guides/pdf", () => ({
  createCareGuidePdf: mocks.createCareGuidePdf,
}));
vi.mock("@/lib/content-images/public", () => ({
  createPublishedContentImageFetchUrl: mocks.createPublishedContentImageFetchUrl,
}));
vi.mock("sharp", () => ({ default: mocks.sharp }));

import { GET } from "./route";

const guideResult = {
  guide: { slug: "betta-splendens" },
  sections: [],
  sources: [],
  images: [
    {
      is_primary: true,
      content_images: {
        storage_path: "care-guides/betta.webp",
        caption: "Betta aquarium",
      },
    },
  ],
};

describe("Care Guide PDF route", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    mocks.createCareGuidePdf.mockReset();
    mocks.createPublishedContentImageFetchUrl.mockReset();
    mocks.getPublishedCareGuideBySlug.mockReset();
    mocks.sharp.mockReset();
  });

  it("returns a valid PDF without an image when the image pipeline fails", async () => {
    const pdfBytes = Uint8Array.from(Buffer.from("%PDF-fallback"));
    mocks.getPublishedCareGuideBySlug.mockResolvedValue(guideResult);
    mocks.createPublishedContentImageFetchUrl.mockRejectedValue(new Error("Storage unavailable"));
    mocks.createCareGuidePdf.mockResolvedValue(pdfBytes);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await GET(new Request("https://example.com/care-guides/betta-splendens/pdf"), {
      params: Promise.resolve({ slug: "betta-splendens" }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(Buffer.from(await response.arrayBuffer())).toEqual(Buffer.from(pdfBytes));
    expect(mocks.createCareGuidePdf).toHaveBeenCalledWith(guideResult.guide, [], [], undefined);
    expect(consoleError).toHaveBeenCalledWith(
      "Care Guide PDF image could not be embedded.",
      expect.objectContaining({ slug: "betta-splendens", storagePath: "care-guides/betta.webp" }),
    );
  });

  it("bounds and compresses an available image before embedding it", async () => {
    const sourceBytes = Uint8Array.from([1, 2, 3]);
    const optimizedBytes = Uint8Array.from([4, 5, 6]);
    const pipeline = {
      rotate: vi.fn(),
      resize: vi.fn(),
      png: vi.fn(),
      toBuffer: vi.fn().mockResolvedValue(optimizedBytes),
    };
    pipeline.rotate.mockReturnValue(pipeline);
    pipeline.resize.mockReturnValue(pipeline);
    pipeline.png.mockReturnValue(pipeline);
    mocks.sharp.mockReturnValue(pipeline);
    mocks.getPublishedCareGuideBySlug.mockResolvedValue(guideResult);
    mocks.createPublishedContentImageFetchUrl.mockResolvedValue("https://example.com/betta.webp");
    mocks.createCareGuidePdf.mockResolvedValue(Uint8Array.from(Buffer.from("%PDF-image")));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(sourceBytes, { status: 200 })));

    await GET(new Request("https://example.com/care-guides/betta-splendens/pdf"), {
      params: Promise.resolve({ slug: "betta-splendens" }),
    });

    expect(pipeline.resize).toHaveBeenCalledWith({
      width: 1200,
      height: 1200,
      fit: "inside",
      withoutEnlargement: true,
    });
    expect(pipeline.png).toHaveBeenCalledWith({ compressionLevel: 9 });
    expect(mocks.createCareGuidePdf).toHaveBeenCalledWith(
      guideResult.guide,
      [],
      [],
      { bytes: optimizedBytes, caption: "Betta aquarium" },
    );
  });
});

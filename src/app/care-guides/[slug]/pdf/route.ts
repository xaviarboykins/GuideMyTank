import { NextResponse } from "next/server";
import { getPublishedCareGuideBySlug } from "@/lib/care-guides/service";
import { createCareGuidePdf } from "@/lib/care-guides/pdf";
import { createPublishedContentImageFetchUrl } from "@/lib/content-images/public";
import sharp from "sharp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const result = await getPublishedCareGuideBySlug(slug);
  if (!result) return new NextResponse("Care Guide not found", { status: 404 });
  const primaryImage = result.images.find((image) => image.is_primary) ?? result.images[0];
  let pdfImage: { bytes: Uint8Array; caption: string | null } | undefined;
  if (primaryImage) {
    try {
      const imageUrl = await createPublishedContentImageFetchUrl(primaryImage.content_images.storage_path);
      if (imageUrl) {
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error(`Image request failed with status ${response.status}.`);
        const png = await sharp(Buffer.from(await response.arrayBuffer()))
          .rotate()
          .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
          .png({ compressionLevel: 9 })
          .toBuffer();
        pdfImage = { bytes: png, caption: primaryImage.content_images.caption };
      }
    } catch (error) {
      console.error("Care Guide PDF image could not be embedded.", {
        slug,
        storagePath: primaryImage.content_images.storage_path,
        error,
      });
    }
  }
  const bytes = await createCareGuidePdf(result.guide, result.sections, result.sources, pdfImage);
  return new NextResponse(Buffer.from(bytes), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${result.guide.slug}-care-guide.pdf"`, "Cache-Control": "no-store, max-age=0" } });
}

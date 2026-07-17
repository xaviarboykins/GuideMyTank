import { NextResponse } from "next/server";
import { getPublishedCareGuideBySlug } from "@/lib/care-guides/service";
import { createCareGuidePdf } from "@/lib/care-guides/pdf";
import { createPublishedContentImageSignedUrls } from "@/lib/content-images/service";
import sharp from "sharp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const result = await getPublishedCareGuideBySlug(slug);
  if (!result) return new NextResponse("Care Guide not found", { status: 404 });
  const primaryImage = result.images.find((image) => image.is_primary) ?? result.images[0];
  let pdfImage: { bytes: Uint8Array; caption: string | null } | undefined;
  if (primaryImage) {
    const urls = await createPublishedContentImageSignedUrls([primaryImage.content_images.storage_path]);
    const imageUrl = urls.get(primaryImage.content_images.storage_path);
    if (imageUrl) {
      const response = await fetch(imageUrl);
      if (response.ok) {
        const png = await sharp(Buffer.from(await response.arrayBuffer())).rotate().png().toBuffer();
        pdfImage = { bytes: png, caption: primaryImage.content_images.caption };
      }
    }
  }
  const bytes = await createCareGuidePdf(result.guide, result.sections, result.sources, pdfImage);
  return new NextResponse(Buffer.from(bytes), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${result.guide.slug}-care-guide.pdf"`, "Cache-Control": "no-store, max-age=0" } });
}

import { NextResponse } from "next/server";
import { createCareGuidePdf } from "@/lib/care-guides/pdf";
import { getPublishedCareGuideBySlug } from "@/lib/care-guides/service";
import { createPublishedContentImageFetchUrl } from "@/lib/content-images/public";

type PdfImageFormat = "jpeg" | "png";

function getDirectImageFormat(storagePath: string, contentType: string | null): PdfImageFormat | null {
  const normalizedContentType = contentType?.split(";", 1)[0].trim().toLowerCase();
  if (normalizedContentType === "image/png") return "png";
  if (normalizedContentType === "image/jpeg") return "jpeg";

  const normalizedPath = storagePath.toLowerCase();
  if (normalizedPath.endsWith(".png")) return "png";
  if (normalizedPath.endsWith(".jpg") || normalizedPath.endsWith(".jpeg")) return "jpeg";
  return null;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const result = await getPublishedCareGuideBySlug(slug);
  if (!result) return new NextResponse("Care Guide not found", { status: 404 });
  const primaryImage = result.images.find((image) => image.is_primary) ?? result.images[0];
  let pdfImage: { bytes: Uint8Array; caption: string | null; format: PdfImageFormat } | undefined;
  if (primaryImage) {
    try {
      const storagePath = primaryImage.content_images.storage_path;
      const imageUrl = await createPublishedContentImageFetchUrl(storagePath);
      if (imageUrl) {
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error(`Image request failed with status ${response.status}.`);
        const sourceBytes = new Uint8Array(await response.arrayBuffer());
        const directFormat = getDirectImageFormat(storagePath, response.headers.get("content-type"));
        if (directFormat) {
          pdfImage = { bytes: sourceBytes, caption: primaryImage.content_images.caption, format: directFormat };
        } else {
          const { default: sharp } = await import("sharp");
          const png = await sharp(sourceBytes)
            .rotate()
            .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
            .png({ compressionLevel: 9 })
            .toBuffer();
          pdfImage = { bytes: png, caption: primaryImage.content_images.caption, format: "png" };
        }
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

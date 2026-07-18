import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CareGuideArticle } from "@/components/care-guides/care-guide-article";
import { Button } from "@/components/ui/button";
import { getCareGuideEditorData } from "@/lib/care-guides/service";
import { createContentImageSignedUrls } from "@/lib/content-images/service";

export const metadata: Metadata = { title: "Care Guide Preview", robots: { index: false, follow: false, nocache: true } };
export const dynamic = "force-dynamic";

export default async function CareGuidePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const editor = await getCareGuideEditorData(id);
  if (!editor) notFound();
  const { guide, sections, images, sources, relatedSpecies } = editor;
  const imageUrls = await createContentImageSignedUrls(images.map((image) => image.content_images.storage_path));

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-5 flex items-center justify-between gap-3 border border-amber-700/40 bg-amber-500/10 p-3 text-sm">
        <strong>Protected draft preview</strong>
        <Button asChild size="sm" variant="outline"><Link href={`/admin/care-guides/${id}`}>Back to editor</Link></Button>
      </div>
      <CareGuideArticle guide={guide} sections={sections} images={images} sources={sources} relatedSpecies={relatedSpecies} imageUrls={imageUrls} />
    </div>
  );
}

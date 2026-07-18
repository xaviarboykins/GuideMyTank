"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);

export function CareGuideImageUploader({ careGuideId, speciesId, nextOrder }: { careGuideId: string; speciesId: string; nextOrder: number }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function upload(formData: FormData) {
    setMessage("");
    const file = formData.get("file");
    const altText = String(formData.get("altText") ?? "").trim();
    if (!(file instanceof File) || file.size === 0) return setMessage("Choose an image file.");
    if (!allowedTypes.has(file.type)) return setMessage("Choose a JPEG, PNG, WebP, AVIF, or GIF image.");
    if (file.size > 10 * 1024 * 1024) return setMessage("The image must be 10 MB or smaller.");
    if (!altText) return setMessage("Alt text is required for Care Guide images.");

    setPending(true);
    const supabase = createClient();
    const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "image";
    const storagePath = `care-guides/${speciesId}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("content-images").upload(storagePath, file, { contentType: file.type });
    if (uploadError) { setPending(false); return setMessage("Upload failed. Confirm the account still has admin access."); }

    const { data: image, error: metadataError } = await supabase.from("content_images").insert({
      species_id: speciesId, storage_path: storagePath, alt_text: altText,
      caption: String(formData.get("caption") ?? "").trim() || null,
      attribution: String(formData.get("attribution") ?? "").trim() || null,
      source_url: String(formData.get("sourceUrl") ?? "").trim() || null,
      license_name: String(formData.get("licenseName") ?? "").trim() || null,
      mime_type: file.type, file_size_bytes: file.size,
    }).select("id").single();
    if (metadataError || !image) {
      await supabase.storage.from("content-images").remove([storagePath]);
      setPending(false);
      return setMessage("The image uploaded, but its metadata could not be saved.");
    }

    const { error: assignmentError } = await supabase.from("care_guide_images").insert({ care_guide_id: careGuideId, image_id: image.id, display_order: nextOrder });
    if (assignmentError) { setPending(false); return setMessage("Image metadata was saved, but it could not be attached to this Care Guide."); }
    setPending(false);
    setMessage("Image uploaded and attached.");
    router.refresh();
  }

  return (
    <form action={upload} className="grid gap-3 border border-border bg-background p-4 md:grid-cols-2">
      <label className="space-y-1"><span className="text-sm font-medium">Image file</span><Input name="file" type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" required /></label>
      <label className="space-y-1"><span className="text-sm font-medium">Alt text</span><Input name="altText" required /></label>
      <label className="space-y-1"><span className="text-sm font-medium">Caption</span><Input name="caption" /></label>
      <label className="space-y-1"><span className="text-sm font-medium">Attribution</span><Input name="attribution" /></label>
      <label className="space-y-1"><span className="text-sm font-medium">Source URL</span><Input name="sourceUrl" type="url" /></label>
      <label className="space-y-1"><span className="text-sm font-medium">License</span><Input name="licenseName" /></label>
      <div className="md:col-span-2"><Button type="submit" disabled={pending}>{pending ? "Uploading…" : "Upload Care Guide image"}</Button>{message ? <p role="status" className="mt-2 text-sm">{message}</p> : null}</div>
    </form>
  );
}


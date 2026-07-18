"use server";

import { redirect } from "next/navigation";

import { createCareGuideDraft } from "@/lib/care-guides/service";
import { getSafeContentError } from "@/lib/content/errors";

export async function createCareGuideDraftAction(formData: FormData) {
  let guideId: string;
  try {
    const guide = await createCareGuideDraft(String(formData.get("speciesId") ?? ""));
    guideId = guide.id;
  } catch (error) {
    const safeError = getSafeContentError(error);
    redirect(`/admin/care-guides/new?error=${encodeURIComponent(safeError.message)}`);
  }
  redirect(`/admin/care-guides/${guideId}`);
}

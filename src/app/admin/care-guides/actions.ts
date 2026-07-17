"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { deleteCareGuideDraft } from "@/lib/care-guides/service";
import { getSafeContentError } from "@/lib/content/errors";

export async function deleteCareGuideDraftAction(id: string) {
  try {
    await deleteCareGuideDraft(id);
  } catch (error) {
    redirect(`/admin/care-guides?error=${encodeURIComponent(getSafeContentError(error).message)}`);
  }
  revalidatePath("/admin/care-guides");
  redirect("/admin/care-guides?deleted=Care+Guide+draft+deleted.");
}


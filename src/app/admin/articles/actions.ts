"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deleteArticleDraft } from "@/lib/articles/service";
import { getSafeContentError } from "@/lib/content/errors";

export async function deleteArticleDraftAction(id: string) {
  try { await deleteArticleDraft(id); }
  catch (error) { redirect(`/admin/articles?error=${encodeURIComponent(getSafeContentError(error).message)}`); }
  revalidatePath("/admin/articles");
  redirect("/admin/articles?deleted=Article+draft+deleted.");
}

"use server";

import { redirect } from "next/navigation";
import { createArticleDraft } from "@/lib/articles/service";
import { getSafeContentError } from "@/lib/content/errors";

export async function createArticleDraftAction(formData: FormData) {
  let id = "";
  try { id = (await createArticleDraft(String(formData.get("title") ?? "Untitled Article").trim() || "Untitled Article")).id; }
  catch (error) { redirect(`/admin/articles/new?error=${encodeURIComponent(getSafeContentError(error).message)}`); }
  redirect(`/admin/articles/${id}`);
}

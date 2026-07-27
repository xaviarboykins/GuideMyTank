"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSafeContentError } from "@/lib/content/errors";
import { applyGuideRegenerationProposal } from "@/lib/guides/repository";

export async function applyGuideProposalAction(
  articleId: string,
  proposalHash: string,
  formData: FormData,
) {
  try {
    await applyGuideRegenerationProposal(
      articleId,
      proposalHash,
      formData.get("confirmPublishedToDraft") === "on",
    );
  } catch (error) {
    redirect(`/admin/guides?error=${encodeURIComponent(getSafeContentError(error).message)}`);
  }
  revalidatePath("/admin/guides");
  revalidatePath(`/admin/articles/${articleId}`);
  redirect(`/admin/articles/${articleId}?saved=${encodeURIComponent("Regeneration proposal applied. Review the Draft before publishing.")}`);
}

"use server";

import { redirect } from "next/navigation";

import { getSafeContentError } from "@/lib/content/errors";
import { generateSpeciesComparisonDraft } from "@/lib/guides/comparison/service";
import { generateTankMateGuideDraft } from "@/lib/guides/tank-mates/service";
import { generateTankSizeGuideDraft } from "@/lib/guides/tank-size/service";

export async function generateGuideDraftAction(formData: FormData) {
  let destination: string;
  try {
    const family = String(formData.get("family"));
    const result = family === "comparison"
      ? await generateSpeciesComparisonDraft({ speciesASlug: String(formData.get("speciesA")), speciesBSlug: String(formData.get("speciesB")) })
      : family === "tank-mates"
        ? await generateTankMateGuideDraft({ speciesSlug: String(formData.get("species")), variant: String(formData.get("variant")) as "tank-mates" | "avoid-with" })
        : await generateTankSizeGuideDraft({ gallons: Number(formData.get("gallons")), variation: String(formData.get("variation")) as "general" | "community" });
    if (result.outcome === "review_required") {
      destination = `/admin/guides?saved=${encodeURIComponent("Regeneration proposal created for editorial review.")}`;
    } else {
      destination = `/admin/articles/${result.articleId}?saved=${encodeURIComponent(result.outcome === "created" ? "Guide Draft generated." : "Guide Draft regenerated.")}`;
    }
  } catch (error) {
    redirect(`/admin/guides/new?error=${encodeURIComponent(getSafeContentError(error).message)}`);
  }
  redirect(destination);
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  addCareGuideImage,
  addCareGuideSource,
  addRelatedSpecies,
  archiveCareGuide,
  publishCareGuide,
  removeCareGuideImage,
  removeCareGuideSource,
  removeRelatedSpecies,
  saveCareGuideSections,
  setPrimaryCareGuideImage,
  updateCareGuideDraft,
  updateCareGuideImageOrder,
} from "@/lib/care-guides/service";
import { getSafeContentError } from "@/lib/content/errors";
import { createSource } from "@/lib/content-sources/service";
import type { ValidationIssue } from "@/lib/content/types";
import type { Json } from "@/types/database.types";

type PublishState = { ok: boolean; message: string; issues: ValidationIssue[] };

function value(formData: FormData, name: string) {
  const result = String(formData.get(name) ?? "").trim();
  return result || null;
}

function returnToGuide(id: string, key: "saved" | "error", message: string): never {
  redirect(`/admin/care-guides/${id}?${key}=${encodeURIComponent(message)}`);
}

async function runGuideAction(id: string, successMessage: string, operation: () => Promise<unknown>): Promise<never> {
  try { await operation(); }
  catch (error) { returnToGuide(id, "error", getSafeContentError(error).message); }
  returnToGuide(id, "saved", successMessage);
}

export async function saveCareGuideFieldsAction(id: string, formData: FormData) {
  return runGuideAction(id, "Publishing fields saved.", () => updateCareGuideDraft(id, {
      title: value(formData, "title"), slug: value(formData, "slug"), summary: value(formData, "summary"),
      seo_title: value(formData, "seoTitle"), meta_description: value(formData, "metaDescription"),
      canonical_url: value(formData, "canonicalUrl"), is_featured: formData.get("isFeatured") === "on",
    }));
}

export async function saveQuickFactsAction(id: string, formData: FormData) {
  const quickFacts: Record<string, Json> = {};
  for (const [key, entry] of formData.entries()) {
    if (key.startsWith("fact_") && typeof entry === "string") quickFacts[key.slice(5)] = entry.trim();
  }
  return runGuideAction(id, "Quick facts saved.", () => updateCareGuideDraft(id, { quick_facts: quickFacts }));
}

export async function saveSectionsAction(id: string, formData: FormData) {
  const sectionTypes = formData.getAll("sectionType").map(String);
  const rows = sectionTypes.flatMap((sectionType, displayOrder) => {
    const text = String(formData.get(`content_${sectionType}`) ?? "").trim();
    return text ? [{ section_type: sectionType, heading: value(formData, `heading_${sectionType}`), content: { text }, display_order: displayOrder }] : [];
  });
  return runGuideAction(id, "Structured sections saved.", () => saveCareGuideSections(id, rows));
}

export async function attachExistingImageAction(id: string, nextOrder: number, formData: FormData) {
  return runGuideAction(id, "Image attached.", () => addCareGuideImage(id, String(formData.get("imageId") ?? ""), nextOrder));
}

export async function setPrimaryImageAction(id: string, formData: FormData) {
  return runGuideAction(id, "Primary image updated.", () => setPrimaryCareGuideImage(id, String(formData.get("imageId") ?? "")));
}

export async function removeImageAction(id: string, formData: FormData) {
  return runGuideAction(id, "Image removed.", () => removeCareGuideImage(id, String(formData.get("imageId") ?? "")));
}

export async function reorderImageAction(id: string, formData: FormData) {
  return runGuideAction(id, "Image order updated.", () => updateCareGuideImageOrder(id, String(formData.get("imageId") ?? ""), Number(formData.get("displayOrder"))));
}

export async function addSourceAction(id: string, nextOrder: number, formData: FormData) {
  return runGuideAction(id, "Source added.", async () => {
    const source = await createSource({
      title: String(formData.get("title") ?? "").trim(), publisher: value(formData, "publisher"),
      author: value(formData, "author"), url: value(formData, "url"), source_type: String(formData.get("sourceType") ?? "website"),
      accessed_date: value(formData, "accessedDate"),
    });
    await addCareGuideSource(id, source.id, nextOrder, value(formData, "citationLabel") ?? undefined);
  });
}

export async function removeSourceAction(id: string, formData: FormData) {
  return runGuideAction(id, "Source removed.", () => removeCareGuideSource(id, String(formData.get("sourceId") ?? "")));
}

export async function addRelatedSpeciesAction(id: string, nextOrder: number, formData: FormData) {
  return runGuideAction(id, "Related species added.", () => addRelatedSpecies(id, String(formData.get("speciesId") ?? ""), nextOrder, value(formData, "relationshipLabel") ?? undefined));
}

export async function removeRelatedSpeciesAction(id: string, formData: FormData) {
  return runGuideAction(id, "Related species removed.", () => removeRelatedSpecies(id, String(formData.get("speciesId") ?? "")));
}

export async function publishCareGuideAction(id: string, state: PublishState): Promise<PublishState> {
  void state;
  try {
    const result = await publishCareGuide(id);
    if (!result.valid) return { ok: false, message: "The Care Guide is not ready to publish.", issues: result.issues };
    revalidatePath(`/admin/care-guides/${id}`);
    return { ok: true, message: "Care Guide published.", issues: [] };
  } catch (error) { return { ok: false, message: getSafeContentError(error).message, issues: [] }; }
}

export async function archiveCareGuideAction(id: string) {
  await archiveCareGuide(id);
  revalidatePath(`/admin/care-guides/${id}`);
}

import "server-only";

import { assertAdmin } from "@/lib/auth/admin";
import { throwContentDatabaseError } from "@/lib/content/database";
import { ContentServiceError } from "@/lib/content/errors";
import { normalizeContentSlug } from "@/lib/content/slug";
import { validateCareGuideSectionContent } from "@/lib/content/structured-data";
import { createClient } from "@/lib/supabase/server";
import { createStaticClient } from "@/lib/supabase/static";
import type { Database, Json } from "@/types/database.types";

import { REQUIRED_CARE_GUIDE_SECTIONS, validateCareGuideForPublication } from "./validation";

type CareGuideUpdate = Database["public"]["Tables"]["care_guides"]["Update"];
type CareGuideSectionInsert = Database["public"]["Tables"]["care_guide_sections"]["Insert"];

export async function listPublishedCareGuides() {
  const supabase = createStaticClient();
  const { data, error } = await supabase
    .from("care_guides")
    .select("id,title,slug,summary,quick_facts,species!care_guides_species_id_fkey(id,slug,common_name,scientific_name,summary,care_level,tank_size_gal,temperament,family),care_guide_images(image_id,is_primary,display_order,content_images(storage_path,alt_text))")
    .eq("status", "published")
    .order("published_at", { ascending: false });
  throwContentDatabaseError(error, "list published Care Guides");
  return data ?? [];
}

export async function getPublishedCareGuideBySlug(slug: string) {
  const supabase = await createClient();
  const { data: guide, error } = await supabase
    .from("care_guides")
    .select("*,species!care_guides_species_id_fkey(id,slug,common_name,scientific_name)")
    .eq("slug", normalizeContentSlug(slug))
    .eq("status", "published")
    .maybeSingle();
  throwContentDatabaseError(error, "load the published Care Guide");
  if (!guide) return null;
  const [sections, images, sources] = await Promise.all([
    supabase.from("care_guide_sections").select("*").eq("care_guide_id", guide.id).order("display_order"),
    supabase.from("care_guide_images").select("*,content_images(*)").eq("care_guide_id", guide.id).order("display_order"),
    supabase.from("care_guide_sources").select("*,sources(*)").eq("care_guide_id", guide.id).order("display_order"),
  ]);
  throwContentDatabaseError(sections.error, "load published Care Guide sections");
  throwContentDatabaseError(images.error, "load published Care Guide images");
  throwContentDatabaseError(sources.error, "load published Care Guide sources");
  return { guide, sections: sections.data ?? [], images: images.data ?? [], sources: sources.data ?? [] };
}

export async function createCareGuideDraft(speciesId: string) {
  await assertAdmin();
  const normalizedSpeciesId = speciesId.trim();
  if (!normalizedSpeciesId) throw new ContentServiceError("Select a species.", "validation");

  const supabase = await createClient();
  const { data: species, error: speciesError } = await supabase
    .from("species")
    .select("id,common_name,slug")
    .eq("id", normalizedSpeciesId)
    .maybeSingle();
  throwContentDatabaseError(speciesError, "verify the species");
  if (!species) throw new ContentServiceError("The selected species does not exist.", "foreign_key");

  const { data, error } = await supabase
    .from("care_guides")
    .insert({
      species_id: species.id,
      title: `${species.common_name} Care Guide`,
      slug: normalizeContentSlug(species.slug),
    })
    .select("*")
    .single();
  throwContentDatabaseError(error, "create the Care Guide draft");
  return data;
}

export async function getAdminCareGuide(id: string) {
  await assertAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("care_guides")
    .select("*,species!care_guides_species_id_fkey(id,slug,common_name,scientific_name)")
    .eq("id", id)
    .maybeSingle();
  throwContentDatabaseError(error, "load the Care Guide");
  return data;
}

export async function getCareGuideEditorData(id: string) {
  await assertAdmin();
  const supabase = await createClient();
  const [guide, sections, images, sources, relatedSpecies, allSpecies] = await Promise.all([
    supabase.from("care_guides").select("*,species!care_guides_species_id_fkey(id,slug,common_name,scientific_name)").eq("id", id).maybeSingle(),
    supabase.from("care_guide_sections").select("*").eq("care_guide_id", id).order("display_order"),
    supabase.from("care_guide_images").select("*,content_images(*)").eq("care_guide_id", id).order("display_order"),
    supabase.from("care_guide_sources").select("*,sources(*)").eq("care_guide_id", id).order("display_order"),
    supabase.from("care_guide_related_species").select("*,species(id,slug,common_name,scientific_name)").eq("care_guide_id", id).order("display_order"),
    supabase.from("species").select("id,slug,common_name,scientific_name").order("common_name"),
  ]);
  throwContentDatabaseError(guide.error, "load the Care Guide");
  throwContentDatabaseError(sections.error, "load Care Guide sections");
  throwContentDatabaseError(images.error, "load Care Guide images");
  throwContentDatabaseError(sources.error, "load Care Guide sources");
  throwContentDatabaseError(relatedSpecies.error, "load related species");
  throwContentDatabaseError(allSpecies.error, "load species choices");
  if (!guide.data) return null;
  return {
    guide: guide.data,
    sections: sections.data ?? [],
    images: images.data ?? [],
    sources: sources.data ?? [],
    relatedSpecies: relatedSpecies.data ?? [],
    allSpecies: allSpecies.data ?? [],
  };
}

export async function searchAdminSpecies(query = "") {
  await assertAdmin();
  const supabase = await createClient();
  const normalizedQuery = query.replace(/[%_,().]/g, " ").trim();
  let speciesRequest = supabase
    .from("species")
    .select("id,slug,common_name,scientific_name")
    .order("common_name")
    .limit(50);
  if (normalizedQuery) {
    speciesRequest = speciesRequest.or(`common_name.ilike.%${normalizedQuery}%,scientific_name.ilike.%${normalizedQuery}%,slug.ilike.%${normalizedQuery}%`);
  }
  const { data, error } = await speciesRequest;
  throwContentDatabaseError(error, "search species");
  return data;
}

export async function listAdminCareGuides(query = "", status?: string) {
  await assertAdmin();
  const supabase = await createClient();
  let request = supabase
    .from("care_guides")
    .select("id,title,slug,status,updated_at,published_at,species!care_guides_species_id_fkey(id,slug,common_name)")
    .order("updated_at", { ascending: false });

  const normalizedQuery = query.replace(/[%_,().]/g, " ").trim();
  if (normalizedQuery) request = request.or(`title.ilike.%${normalizedQuery}%,slug.ilike.%${normalizedQuery}%`);
  if (status) request = request.eq("status", status);

  const { data, error } = await request;
  throwContentDatabaseError(error, "list Care Guides");
  return data;
}

export async function updateCareGuideDraft(id: string, update: CareGuideUpdate) {
  await assertAdmin();
  const safeUpdate: CareGuideUpdate = { ...update };
  delete safeUpdate.id;
  delete safeUpdate.status;
  delete safeUpdate.published_at;
  if (typeof safeUpdate.slug === "string") safeUpdate.slug = normalizeContentSlug(safeUpdate.slug) || null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("care_guides")
    .update(safeUpdate)
    .eq("id", id)
    .in("status", ["draft", "archived"])
    .select("*")
    .single();
  throwContentDatabaseError(error, "save the Care Guide");
  return data;
}

export async function saveCareGuideSections(id: string, sections: Omit<CareGuideSectionInsert, "care_guide_id">[]) {
  await assertAdmin();
  const allowedSectionTypes = new Set([
    ...REQUIRED_CARE_GUIDE_SECTIONS,
    "adult_size_and_lifespan", "filtration_and_flow", "heating_requirements",
    "lighting", "substrate", "plants_and_decor", "social_requirements",
    "species_to_avoid", "breeding", "frequently_asked_questions",
  ]);
  for (const section of sections) {
    if (!allowedSectionTypes.has(section.section_type)) throw new ContentServiceError("Unknown Care Guide section type.", "validation");
    const validation = validateCareGuideSectionContent(section.section_type, section.content ?? {});
    if (!validation.valid) throw new ContentServiceError(validation.issues[0].message, "validation");
  }
  const supabase = await createClient();
  const rows = sections.map((section) => ({ ...section, care_guide_id: id }));
  const { data, error } = await supabase
    .from("care_guide_sections")
    .upsert(rows, { onConflict: "care_guide_id,section_type" })
    .select("*");
  throwContentDatabaseError(error, "save Care Guide sections");
  return data;
}

export async function isCareGuideSlugAvailable(slug: string, excludeId?: string) {
  await assertAdmin();
  const supabase = await createClient();
  let request = supabase.from("care_guides").select("id").eq("slug", normalizeContentSlug(slug));
  if (excludeId) request = request.neq("id", excludeId);
  const { data, error } = await request.limit(1);
  throwContentDatabaseError(error, "check the Care Guide slug");
  return data.length === 0;
}

export async function publishCareGuide(id: string) {
  await assertAdmin();
  const supabase = await createClient();
  const [guideResult, sectionsResult, imagesResult, sourcesResult] = await Promise.all([
    supabase.from("care_guides").select("*").eq("id", id).maybeSingle(),
    supabase.from("care_guide_sections").select("section_type,content").eq("care_guide_id", id),
    supabase.from("care_guide_images").select("image_id,is_primary,content_images(species_id,alt_text)").eq("care_guide_id", id),
    supabase.from("care_guide_sources").select("source_id", { count: "exact", head: true }).eq("care_guide_id", id),
  ]);
  throwContentDatabaseError(guideResult.error, "load the Care Guide");
  throwContentDatabaseError(sectionsResult.error, "load Care Guide sections");
  throwContentDatabaseError(imagesResult.error, "load Care Guide images");
  throwContentDatabaseError(sourcesResult.error, "load Care Guide sources");
  if (!guideResult.data) throw new ContentServiceError("Care Guide not found.", "not_found");

  const guide = guideResult.data;
  const slugAvailable = guide.slug ? await isCareGuideSlugAvailable(guide.slug, guide.id) : false;
  const validation = validateCareGuideForPublication({
    speciesId: guide.species_id,
    title: guide.title,
    slug: guide.slug,
    summary: guide.summary,
    quickFacts: typeof guide.quick_facts === "object" && guide.quick_facts && !Array.isArray(guide.quick_facts) ? guide.quick_facts : {},
    sections: (sectionsResult.data ?? []).map((section) => ({ sectionType: section.section_type, content: section.content })),
    images: (imagesResult.data ?? []).map((assignment) => ({
      imageId: assignment.image_id,
      speciesId: assignment.content_images?.species_id ?? null,
      isPrimary: assignment.is_primary,
      altText: assignment.content_images?.alt_text ?? null,
    })),
    sourceCount: sourcesResult.count ?? 0,
    slugAvailable,
  });

  if (!validation.valid) return validation;

  const { error } = await supabase
    .from("care_guides")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", id);
  throwContentDatabaseError(error, "publish the Care Guide");
  return validation;
}

export async function archiveCareGuide(id: string) {
  await assertAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("care_guides").update({ status: "archived" }).eq("id", id);
  throwContentDatabaseError(error, "archive the Care Guide");
}

export async function deleteCareGuideDraft(id: string) {
  await assertAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("care_guides")
    .delete()
    .eq("id", id)
    .eq("status", "draft")
    .select("id")
    .maybeSingle();
  throwContentDatabaseError(error, "delete the Care Guide draft");
  if (!data) throw new ContentServiceError("Only draft Care Guides can be deleted.", "validation");
}

export async function addCareGuideImage(careGuideId: string, imageId: string, displayOrder: number) {
  await assertAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("care_guide_images")
    .insert({ care_guide_id: careGuideId, image_id: imageId, display_order: displayOrder })
    .select("*")
    .single();
  throwContentDatabaseError(error, "add the Care Guide image");
  return data;
}

export async function setPrimaryCareGuideImage(careGuideId: string, imageId: string) {
  await assertAdmin();
  const supabase = await createClient();
  const { error: clearError } = await supabase
    .from("care_guide_images")
    .update({ is_primary: false })
    .eq("care_guide_id", careGuideId)
    .eq("is_primary", true);
  throwContentDatabaseError(clearError, "clear the primary Care Guide image");
  const { error } = await supabase
    .from("care_guide_images")
    .update({ is_primary: true })
    .eq("care_guide_id", careGuideId)
    .eq("image_id", imageId);
  throwContentDatabaseError(error, "set the primary Care Guide image");
}

export async function removeCareGuideImage(careGuideId: string, imageId: string) {
  await assertAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("care_guide_images").delete().eq("care_guide_id", careGuideId).eq("image_id", imageId);
  throwContentDatabaseError(error, "remove the Care Guide image");
}

export async function updateCareGuideImageOrder(careGuideId: string, imageId: string, displayOrder: number) {
  await assertAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("care_guide_images")
    .update({ display_order: displayOrder })
    .eq("care_guide_id", careGuideId)
    .eq("image_id", imageId);
  throwContentDatabaseError(error, "reorder the Care Guide image");
}

export async function addCareGuideSource(careGuideId: string, sourceId: string, displayOrder: number, citationLabel?: string) {
  await assertAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("care_guide_sources").insert({
    care_guide_id: careGuideId,
    source_id: sourceId,
    display_order: displayOrder,
    citation_label: citationLabel?.trim() || null,
  });
  throwContentDatabaseError(error, "add the Care Guide source");
}

export async function removeCareGuideSource(careGuideId: string, sourceId: string) {
  await assertAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("care_guide_sources").delete().eq("care_guide_id", careGuideId).eq("source_id", sourceId);
  throwContentDatabaseError(error, "remove the Care Guide source");
}

export async function addRelatedSpecies(careGuideId: string, speciesId: string, displayOrder: number, relationshipLabel?: string) {
  await assertAdmin();
  const supabase = await createClient();
  const { data: guide, error: guideError } = await supabase.from("care_guides").select("species_id").eq("id", careGuideId).single();
  throwContentDatabaseError(guideError, "load the Care Guide species");
  if (guide.species_id === speciesId) throw new ContentServiceError("A Care Guide cannot relate its own species.", "validation");
  const { error } = await supabase.from("care_guide_related_species").insert({
    care_guide_id: careGuideId,
    species_id: speciesId,
    display_order: displayOrder,
    relationship_label: relationshipLabel?.trim() || null,
  });
  throwContentDatabaseError(error, "add the related species");
}

export async function removeRelatedSpecies(careGuideId: string, speciesId: string) {
  await assertAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("care_guide_related_species").delete().eq("care_guide_id", careGuideId).eq("species_id", speciesId);
  throwContentDatabaseError(error, "remove the related species");
}

export function toQuickFactsJson(value: Record<string, unknown>) {
  return value as Json;
}

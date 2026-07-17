import Link from "next/link";
import { notFound } from "next/navigation";

import { CareGuideImageUploader } from "@/components/admin/care-guide-image-uploader";
import { CareGuidePublishControl } from "@/components/admin/care-guide-publish-control";
import { ContentStatus } from "@/components/admin/content-status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCareGuideEditorData } from "@/lib/care-guides/service";
import { REQUIRED_CARE_GUIDE_SECTIONS, REQUIRED_QUICK_FACTS } from "@/lib/care-guides/validation";
import { createContentImageSignedUrls, listContentImages } from "@/lib/content-images/service";
import type { Json } from "@/types/database.types";

import {
  addRelatedSpeciesAction, addSourceAction, archiveCareGuideAction, attachExistingImageAction,
  publishCareGuideAction, removeImageAction, removeRelatedSpeciesAction, removeSourceAction,
  reorderImageAction, saveCareGuideFieldsAction, saveQuickFactsAction, saveSectionsAction,
  setPrimaryImageAction,
} from "./actions";

const SECTION_DEFINITIONS = [
  ["overview", "Overview"], ["natural_habitat", "Natural habitat"],
  ["adult_size_and_lifespan", "Adult size and lifespan"], ["aquarium_requirements", "Aquarium requirements"],
  ["water_parameters", "Water parameters"], ["filtration_and_flow", "Filtration and flow"],
  ["heating_requirements", "Heating requirements"], ["lighting", "Lighting"], ["substrate", "Substrate"],
  ["plants_and_decor", "Plants and decor"], ["behavior_and_temperament", "Behavior and temperament"],
  ["social_requirements", "Social and schooling requirements"], ["tank_mates", "Tank mates"],
  ["species_to_avoid", "Species to avoid"], ["diet_and_feeding", "Diet and feeding"],
  ["common_health_concerns", "Common health concerns"], ["breeding", "Breeding"],
  ["beginner_guidance", "Beginner guidance"], ["frequently_asked_questions", "Frequently asked questions"],
] as const;

const QUICK_FACT_LABELS: Record<(typeof REQUIRED_QUICK_FACTS)[number], string> = {
  scientific_name: "Scientific name", adult_size: "Adult size", lifespan: "Lifespan",
  minimum_tank_size: "Minimum tank size", care_level: "Care level", temperament: "Temperament",
  diet: "Diet", social_requirements: "Social requirements", temperature_range: "Temperature range", ph_range: "pH range",
};

function jsonRecord(value: Json): Record<string, Json | undefined> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value : {};
}

function sectionText(content: Json) {
  const record = jsonRecord(content);
  return typeof record.text === "string" ? record.text : "";
}

type CareGuideEditorPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
};

export default async function CareGuideEditorPage({ params, searchParams }: CareGuideEditorPageProps) {
  const { id } = await params;
  const notices = await searchParams;
  const editor = await getCareGuideEditorData(id);
  if (!editor) notFound();
  const { guide, sections, images, sources, relatedSpecies, allSpecies } = editor;
  const isEditable = guide.status !== "published";
  const quickFacts = jsonRecord(guide.quick_facts);
  const sectionMap = new Map(sections.map((section) => [section.section_type, section]));
  const speciesImages = await listContentImages(guide.species_id);
  const attachedIds = new Set(images.map((image) => image.image_id));
  const availableImages = speciesImages.filter((image) => !attachedIds.has(image.id));
  const signedUrls = await createContentImageSignedUrls(images.map((image) => image.content_images.storage_path));
  const relatedIds = new Set(relatedSpecies.map((item) => item.species_id));
  const availableSpecies = allSpecies.filter((item) => item.id !== guide.species_id && !relatedIds.has(item.id));

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><div className="flex items-center gap-3"><h2 className="text-xl font-semibold">{guide.title ?? "Untitled Care Guide"}</h2><ContentStatus status={guide.status} /></div><p className="mt-1 text-sm text-muted-foreground">{guide.species.common_name} · <span className="italic">{guide.species.scientific_name}</span></p></div>
        <div className="flex gap-2"><Button asChild variant="outline"><Link href={`/admin/care-guides/${id}/preview`}>Preview</Link></Button><Button asChild variant="outline"><Link href="/admin/care-guides">Back</Link></Button></div>
      </div>

      {notices.saved ? <p role="status" className="border border-green-700/40 bg-green-500/10 p-3 text-sm">{notices.saved}</p> : null}
      {notices.error ? <p role="alert" className="border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{notices.error}</p> : null}
      {!isEditable ? <p className="border border-amber-700/40 bg-amber-500/10 p-3 text-sm">Published content is read-only. Archive it before making changes.</p> : null}

      <form action={saveCareGuideFieldsAction.bind(null, id)} className="border border-border bg-card p-5">
        <fieldset disabled={!isEditable} className="grid gap-4 md:grid-cols-2">
          <legend className="mb-4 text-lg font-semibold">Publishing and SEO</legend>
          <label className="space-y-1"><span className="text-sm font-medium">Title</span><Input name="title" defaultValue={guide.title ?? ""} /></label>
          <label className="space-y-1"><span className="text-sm font-medium">Slug</span><Input name="slug" defaultValue={guide.slug ?? ""} /></label>
          <label className="space-y-1 md:col-span-2"><span className="text-sm font-medium">Summary</span><textarea name="summary" defaultValue={guide.summary ?? ""} rows={4} className="w-full rounded-lg border border-input bg-background p-2.5 text-sm" /></label>
          <label className="space-y-1"><span className="text-sm font-medium">SEO title</span><Input name="seoTitle" defaultValue={guide.seo_title ?? ""} /></label>
          <label className="space-y-1"><span className="text-sm font-medium">Canonical URL</span><Input name="canonicalUrl" type="url" defaultValue={guide.canonical_url ?? ""} /></label>
          <label className="space-y-1 md:col-span-2"><span className="text-sm font-medium">Meta description</span><textarea name="metaDescription" defaultValue={guide.meta_description ?? ""} rows={3} className="w-full rounded-lg border border-input bg-background p-2.5 text-sm" /></label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isFeatured" defaultChecked={guide.is_featured} /> Featured</label>
          <div className="md:col-span-2"><Button type="submit">Save publishing fields</Button></div>
        </fieldset>
      </form>

      <form action={saveQuickFactsAction.bind(null, id)} className="border border-border bg-card p-5">
        <fieldset disabled={!isEditable} className="grid gap-4 md:grid-cols-2">
          <legend className="mb-4 text-lg font-semibold">Quick facts</legend>
          {REQUIRED_QUICK_FACTS.map((fact) => <label key={fact} className="space-y-1"><span className="text-sm font-medium">{QUICK_FACT_LABELS[fact]} *</span><Input name={`fact_${fact}`} defaultValue={typeof quickFacts[fact] === "string" ? quickFacts[fact] : ""} /></label>)}
          <div className="md:col-span-2"><Button type="submit">Save quick facts</Button></div>
        </fieldset>
      </form>

      <form action={saveSectionsAction.bind(null, id)} className="border border-border bg-card p-5">
        <fieldset disabled={!isEditable} className="space-y-4">
          <legend className="mb-4 text-lg font-semibold">Structured sections</legend>
          {SECTION_DEFINITIONS.map(([sectionType, label]) => {
            const section = sectionMap.get(sectionType);
            const required = REQUIRED_CARE_GUIDE_SECTIONS.includes(sectionType as (typeof REQUIRED_CARE_GUIDE_SECTIONS)[number]);
            return <details key={sectionType} className="border border-border p-4" open={required && !section}>
              <summary className="cursor-pointer font-medium">{label}{required ? " *" : ""}</summary>
              <input type="hidden" name="sectionType" value={sectionType} />
              <label className="mt-3 block space-y-1"><span className="text-sm font-medium">Heading</span><Input name={`heading_${sectionType}`} defaultValue={section?.heading ?? label} /></label>
              <label className="mt-3 block space-y-1"><span className="text-sm font-medium">Content</span><textarea name={`content_${sectionType}`} defaultValue={section ? sectionText(section.content) : ""} rows={6} className="w-full rounded-lg border border-input bg-background p-2.5 text-sm" /></label>
            </details>;
          })}
          <Button type="submit">Save structured sections</Button>
        </fieldset>
      </form>

      <div className="border border-border bg-card p-5">
        <h3 className="text-lg font-semibold">Care Guide images</h3><p className="mt-1 text-sm text-muted-foreground">These uploads are separate from the species table image. At least two are required to publish.</p>
        {isEditable ? <div className="mt-4"><CareGuideImageUploader careGuideId={id} speciesId={guide.species_id} nextOrder={images.length} /></div> : null}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {images.map((assignment) => <article key={assignment.image_id} className="border border-border p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={signedUrls.get(assignment.content_images.storage_path)} alt={assignment.content_images.alt_text ?? ""} className="h-48 w-full bg-muted object-contain" />
            <p className="mt-2 text-sm font-medium">{assignment.content_images.alt_text ?? "Missing alt text"}</p><p className="text-xs text-muted-foreground">Order {assignment.display_order}{assignment.is_primary ? " · Primary" : ""}</p>
            {isEditable ? <div className="mt-3 flex flex-wrap gap-2">
              {!assignment.is_primary ? <form action={setPrimaryImageAction.bind(null, id)}><input type="hidden" name="imageId" value={assignment.image_id} /><Button size="sm" variant="outline">Set primary</Button></form> : null}
              <form action={reorderImageAction.bind(null, id)} className="flex gap-1"><input type="hidden" name="imageId" value={assignment.image_id} /><Input className="w-20" name="displayOrder" type="number" min="0" defaultValue={assignment.display_order} /><Button size="sm" variant="outline">Order</Button></form>
              <form action={removeImageAction.bind(null, id)}><input type="hidden" name="imageId" value={assignment.image_id} /><Button size="sm" variant="outline">Remove</Button></form>
            </div> : null}
          </article>)}
        </div>
        {isEditable && availableImages.length ? <form action={attachExistingImageAction.bind(null, id, images.length)} className="mt-4 flex gap-2"><select name="imageId" className="h-8 flex-1 rounded-lg border border-input bg-background px-2.5 text-sm">{availableImages.map((image) => <option key={image.id} value={image.id}>{image.alt_text ?? image.storage_path}</option>)}</select><Button type="submit" variant="outline">Attach existing</Button></form> : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="border border-border bg-card p-5"><h3 className="text-lg font-semibold">Sources</h3>
          <ul className="mt-3 space-y-2">{sources.map((assignment) => <li key={assignment.source_id} className="border border-border p-3 text-sm"><p className="font-medium">{assignment.sources.title}</p><p className="text-muted-foreground">{assignment.sources.publisher ?? assignment.sources.url}</p>{isEditable ? <form action={removeSourceAction.bind(null, id)} className="mt-2"><input type="hidden" name="sourceId" value={assignment.source_id} /><Button size="sm" variant="outline">Remove</Button></form> : null}</li>)}</ul>
          {isEditable ? <form action={addSourceAction.bind(null, id, sources.length)} className="mt-4 grid gap-3"><Input name="title" placeholder="Source title" required /><Input name="publisher" placeholder="Publisher or organization" /><Input name="author" placeholder="Author" /><Input name="url" type="url" placeholder="https://…" required /><select name="sourceType" className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"><option value="website">Website</option><option value="book">Book</option><option value="journal">Journal</option><option value="organization">Organization</option><option value="database">Database</option><option value="other">Other</option></select><Input name="accessedDate" type="date" /><Input name="citationLabel" placeholder="Citation label" /><Button type="submit">Add source</Button></form> : null}
        </div>

        <div className="border border-border bg-card p-5"><h3 className="text-lg font-semibold">Related species</h3>
          <ul className="mt-3 space-y-2">{relatedSpecies.map((assignment) => <li key={assignment.species_id} className="flex items-center justify-between gap-3 border border-border p-3 text-sm"><span><strong>{assignment.species.common_name}</strong>{assignment.relationship_label ? ` · ${assignment.relationship_label}` : ""}</span>{isEditable ? <form action={removeRelatedSpeciesAction.bind(null, id)}><input type="hidden" name="speciesId" value={assignment.species_id} /><Button size="sm" variant="outline">Remove</Button></form> : null}</li>)}</ul>
          {isEditable && availableSpecies.length ? <form action={addRelatedSpeciesAction.bind(null, id, relatedSpecies.length)} className="mt-4 grid gap-3"><select name="speciesId" className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm">{availableSpecies.map((species) => <option key={species.id} value={species.id}>{species.common_name} ({species.scientific_name})</option>)}</select><Input name="relationshipLabel" placeholder="Relationship label (optional)" /><Button type="submit">Add related species</Button></form> : null}
        </div>
      </div>

      <div className="border border-border bg-card p-5"><h3 className="text-lg font-semibold">Publishing workflow</h3><div className="mt-4">
        {guide.status === "published" ? <form action={archiveCareGuideAction.bind(null, id)}><Button type="submit" variant="outline">Archive Care Guide</Button></form> : <CareGuidePublishControl action={publishCareGuideAction.bind(null, id)} />}
      </div></div>
    </section>
  );
}


/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const crypto = require("node:crypto");
const { createClient } = require("@supabase/supabase-js");

for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
}
const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const anon = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const runId = crypto.randomUUID().slice(0, 8);
const cleanup = { articles: [], guides: [], images: [], sources: [] };
const pass = (name) => console.log(`PASS ${name}`);
const expectError = (result, name) => { if (!result.error) throw new Error(`Expected failure: ${name}`); pass(name); };
const expectBlocked = (result, name) => {
  if (!result.error && (!Array.isArray(result.data) || result.data.length > 0)) {
    throw new Error(`Expected blocked write: ${name}`);
  }
  pass(name);
};

async function removeTemporaryRecords() {
  for (const id of cleanup.guides) {
    await admin.from("care_guides").update({ status: "archived" }).eq("id", id).eq("status", "published");
    await admin.from("care_guides").update({ status: "draft" }).eq("id", id).eq("status", "archived");
    await admin.from("care_guides").delete().eq("id", id).eq("status", "draft");
  }
  for (const id of cleanup.articles) {
    await admin.from("articles").update({ status: "archived" }).eq("id", id).eq("status", "published");
    await admin.from("articles").update({ status: "draft" }).eq("id", id).eq("status", "archived");
    await admin.from("articles").delete().eq("id", id).eq("status", "draft");
  }
  if (cleanup.images.length) await admin.from("content_images").delete().in("id", cleanup.images);
  if (cleanup.sources.length) await admin.from("sources").delete().in("id", cleanup.sources);
}

async function main() {
  const before = await admin.from("articles").select("id", { count: "exact", head: true });
  const unauthorized = await anon.from("articles").insert({ title: `Unauthorized ${runId}` });
  expectError(unauthorized, "RLS blocks anonymous article writes");

  const article = await admin.from("articles").insert({ title: `Phase G ${runId}`, slug: `phase-g-${runId}`, summary: "Temporary verification article." }).select("*").single();
  if (article.error) throw article.error;
  cleanup.articles.push(article.data.id);
  pass("authorized server write creates article draft");
  const hiddenDraft = await anon.from("articles").select("id").eq("id", article.data.id).maybeSingle();
  if (hiddenDraft.error || hiddenDraft.data) throw new Error("Draft article was publicly visible");
  pass("draft article is not publicly exposed");

  await new Promise((resolve) => setTimeout(resolve, 20));
  const updated = await admin.from("articles").update({ title: `Phase G Updated ${runId}` }).eq("id", article.data.id).select("updated_at").single();
  if (updated.error || new Date(updated.data.updated_at) <= new Date(article.data.updated_at)) throw new Error("updated_at did not advance");
  pass("updated timestamp advances");
  expectError(await admin.from("articles").update({ status: "invalid" }).eq("id", article.data.id), "status constraint rejects invalid values");
  expectError(await admin.from("articles").insert({ title: "Duplicate", slug: `phase-g-${runId}` }), "article slug uniqueness works");

  const section = await admin.from("article_sections").insert({ article_id: article.data.id, block_type: "paragraph", content: { text: "A complete temporary article." }, display_order: 0 });
  if (section.error) throw section.error;
  const publishArticle = await admin.from("articles").update({ status: "published", published_at: new Date().toISOString() }).eq("id", article.data.id).select("status").single();
  if (publishArticle.error) throw publishArticle.error;
  const articleImages = await admin.from("article_images").select("image_id", { count: "exact", head: true }).eq("article_id", article.data.id);
  if (articleImages.count !== 0) throw new Error("Temporary article unexpectedly has images");
  pass("article publishes without images");
  expectBlocked(await anon.from("articles").update({ title: "Unauthorized" }).eq("id", article.data.id).select("id"), "RLS blocks anonymous writes to published content");
  const archiveArticle = await admin.from("articles").update({ status: "archived" }).eq("id", article.data.id);
  if (archiveArticle.error) throw archiveArticle.error;
  const hiddenArchive = await anon.from("articles").select("id").eq("id", article.data.id).maybeSingle();
  if (hiddenArchive.error || hiddenArchive.data) throw new Error("Archived article was publicly visible");
  pass("archived article is not treated as published");

  const existingGuideSpecies = await admin.from("care_guides").select("species_id");
  if (existingGuideSpecies.error) throw existingGuideSpecies.error;
  const used = existingGuideSpecies.data.map((item) => item.species_id);
  let speciesQuery = admin.from("species").select("id").limit(1);
  if (used.length) speciesQuery = speciesQuery.not("id", "in", `(${used.join(",")})`);
  const species = await speciesQuery.single();
  if (species.error) throw species.error;
  expectError(await admin.from("care_guides").insert({ species_id: crypto.randomUUID(), title: "Invalid species" }), "Care Guide species foreign key works");

  const guide = await admin.from("care_guides").insert({ species_id: species.data.id }).select("id").single();
  if (guide.error) throw guide.error;
  cleanup.guides.push(guide.data.id);
  pass("incomplete Care Guide draft can be saved");
  const hiddenGuideDraft = await anon.from("care_guides").select("id").eq("id", guide.data.id).maybeSingle();
  if (hiddenGuideDraft.error || hiddenGuideDraft.data) throw new Error("Draft Care Guide was publicly visible");
  pass("draft Care Guide is not publicly exposed");
  expectError(await admin.from("care_guides").update({ status: "published", published_at: new Date().toISOString() }).eq("id", guide.data.id), "invalid Care Guide cannot publish");

  const facts = { scientific_name: "Test fish", adult_size: "Test", lifespan: "Test", minimum_tank_size: "Test", care_level: "Test", temperament: "Test", diet: "Test", social_requirements: "Test", temperature_range: "Test", ph_range: "Test" };
  const guideUpdate = await admin.from("care_guides").update({ title: `Verification Guide ${runId}`, slug: `verification-guide-${runId}`, summary: "Temporary complete verification guide.", quick_facts: facts }).eq("id", guide.data.id);
  if (guideUpdate.error) throw guideUpdate.error;
  const requiredSections = ["overview", "natural_habitat", "aquarium_requirements", "water_parameters", "behavior_and_temperament", "tank_mates", "diet_and_feeding", "common_health_concerns", "beginner_guidance"];
  const sections = await admin.from("care_guide_sections").insert(requiredSections.map((section_type, display_order) => ({ care_guide_id: guide.data.id, section_type, heading: section_type, content: { text: "Complete verification content." }, display_order })));
  if (sections.error) throw sections.error;
  const source = await admin.from("sources").insert({ title: `Verification Source ${runId}`, url: `https://example.com/${runId}` }).select("id").single();
  if (source.error) throw source.error;
  cleanup.sources.push(source.data.id);
  const guideSource = await admin.from("care_guide_sources").insert({ care_guide_id: guide.data.id, source_id: source.data.id, display_order: 0 });
  if (guideSource.error) throw guideSource.error;
  for (let index = 0; index < 2; index++) {
    const image = await admin.from("content_images").insert({ species_id: species.data.id, storage_path: `care-guides/${species.data.id}/verification-${runId}-${index}.png`, alt_text: `Verification fish ${index}` }).select("id").single();
    if (image.error) throw image.error;
    cleanup.images.push(image.data.id);
    if (index === 0) {
      const primaryImage = await admin.from("care_guide_images").insert({ care_guide_id: guide.data.id, image_id: image.data.id, is_primary: true, display_order: index });
      if (primaryImage.error) throw primaryImage.error;
      expectError(await admin.from("care_guides").update({ status: "published", published_at: new Date().toISOString() }).eq("id", guide.data.id), "Care Guide with fewer than two images cannot publish");
    } else {
      const secondaryImage = await admin.from("care_guide_images").insert({ care_guide_id: guide.data.id, image_id: image.data.id, display_order: index });
      if (secondaryImage.error) throw secondaryImage.error;
    }
  }
  const publishGuide = await admin.from("care_guides").update({ status: "published", published_at: new Date().toISOString() }).eq("id", guide.data.id).select("status").single();
  if (publishGuide.error) throw publishGuide.error;
  pass("valid Care Guide with two images publishes");
  const archiveGuide = await admin.from("care_guides").update({ status: "archived" }).eq("id", guide.data.id);
  if (archiveGuide.error) throw archiveGuide.error;
  const hiddenGuideArchive = await anon.from("care_guides").select("id").eq("id", guide.data.id).maybeSingle();
  if (hiddenGuideArchive.error || hiddenGuideArchive.data) throw new Error("Archived Care Guide was publicly visible");
  pass("archived Care Guide is not treated as published");

  await removeTemporaryRecords();
  cleanup.articles = []; cleanup.guides = []; cleanup.images = []; cleanup.sources = [];
  const after = await admin.from("articles").select("id", { count: "exact", head: true });
  if (before.count !== after.count) throw new Error("Temporary records were not fully cleaned up");
  pass("existing article count remains intact after verification cleanup");
}

main().catch(async (error) => { console.error(`FAIL ${error.message}`); await removeTemporaryRecords(); process.exitCode = 1; });

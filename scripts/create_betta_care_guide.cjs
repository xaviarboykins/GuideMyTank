/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");
const { createClient } = require("@supabase/supabase-js");

function loadEnvironment() {
  const file = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
  for (const line of file.split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}

loadEnvironment();

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) throw new Error("Missing Supabase server environment variables.");

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const sections = [
  ["overview", "Overview", "Betta splendens, commonly called the betta or Siamese fighting fish, is a tropical labyrinth fish known for alert behavior, individual personality, and domesticated color and fin varieties. Its ability to breathe atmospheric air helps it survive oxygen-poor water, but it does not make an unheated bowl appropriate housing. A healthy betta needs warm, conditioned water, a mature biological filter, gentle flow, a secure lid, surface access, and a varied high-protein diet."],
  ["natural_habitat", "Natural habitat", "Wild Betta splendens occur in Southeast Asian standing and slow-moving freshwater, including floodplains, canals, rice paddies, shallow pools, and vegetated margins. These habitats commonly provide dense plant cover, subdued light, warm water, and ready access to the surface. Aquarium care should copy the useful features of that environment—cover, calm flow, warmth, and complexity—without assuming that seasonal wild conditions or poor water quality are desirable in captivity."],
  ["adult_size_and_lifespan", "Adult size and lifespan", "Adults commonly reach about 2.5–3 inches (6–7.5 cm) in body length, although ornamental fins can make long-finned varieties look larger. With stable water, appropriate nutrition, and prompt attention to health changes, a captive betta commonly lives about 3–5 years. Age at purchase, genetics, prior care, and chronic stress can shorten that span."],
  ["aquarium_requirements", "Aquarium requirements", "Use a rectangular, fully cycled aquarium of at least 5 US gallons (about 19 L) for a typical single betta; 10 gallons offers more swimming room and more stable temperature and water chemistry. Provide a secure lid because bettas can jump, while leaving humid air space above the water. Keep an open route to the surface and include shaded resting areas, smooth hides, and broad leaves near the upper water level."],
  ["water_parameters", "Water parameters", "Aim for stable water rather than chasing an exact number. A practical target is 76–81°F (24.5–27°C), pH about 6.5–7.8, and moderate hardness that does not change abruptly. FishBase reports a broader species range of pH 6.0–8.0 and 24–30°C. In a cycled aquarium, ammonia and nitrite should remain at 0 ppm; keep nitrate low through testing, sensible feeding, plant growth, and regular partial water changes."],
  ["filtration_and_flow", "Filtration and flow", "Run a filter continuously to support nitrifying bacteria and capture debris. Choose a sponge filter or an adjustable filter with a gentle output. Long-finned bettas tire easily in strong current, so baffle an excessive outflow rather than turning filtration off. Rinse reusable filter media in removed aquarium water when flow declines; do not replace all biological media or deep-clean every surface at once."],
  ["heating_requirements", "Heating requirements", "Use a thermostatically controlled aquarium heater and a separate thermometer unless the room reliably maintains the target temperature day and night. Select equipment appropriate for the tank volume and position it where water circulates gently around it. Avoid rapid temperature changes during water changes by matching replacement water closely to the aquarium."],
  ["lighting", "Lighting", "Provide a consistent day-and-night cycle, typically about 8–10 hours of moderate light when live plants are present. Bettas appreciate shaded zones beneath floating plants or broad leaves. Avoid leaving bright aquarium lights on continuously; excessive light can increase stress and algae without benefiting the fish."],
  ["substrate", "Substrate", "Bare-bottom tanks can work for quarantine, but a maintained display aquarium may use smooth sand or rounded fine gravel. Rinse new substrate before use and avoid sharp material that can snag fins. Siphon accessible debris during partial water changes without aggressively disturbing every planted area."],
  ["plants_and_decor", "Plants and decor", "Live plants such as Anubias, Java fern, Cryptocoryne, mosses, and suitable floating plants create cover and resting surfaces. Silk plants are safer than rigid plastic when live plants are not practical. Use smooth caves and driftwood with openings large enough to prevent entrapment. Keep part of the surface unobstructed and inspect every decoration for sharp edges."],
  ["behavior_and_temperament", "Behavior and temperament", "Bettas are observant, territorial fish that explore, rest on leaves, investigate movement, and regularly visit the surface to breathe. Adult males should never be housed together: even very large, enriched aquaria do not guarantee peaceful cohabitation. Individual responses to reflections and neighboring fish vary. Brief flaring can be normal, but constant display, glass surfing, hiding, or clamped fins calls for an environmental review."],
  ["social_requirements", "Social and schooling requirements", "Betta splendens is not a schooling species and does not require another betta for companionship. A single betta can thrive alone when the aquarium provides space and enrichment. Female groups are advanced, risk-prone arrangements rather than a default care recommendation; aggression, chronic stress, and injury can occur even with cover and space."],
  ["tank_mates", "Tank mates", "A solitary setup is the safest and simplest choice. In a larger, mature aquarium, some individuals tolerate peaceful bottom-dwellers, small non-nipping schooling fish, or snails, but temperament varies and a backup separation plan is essential. Check the needs and group size of every proposed companion; never crowd other species into a tank sized only for one betta. Shrimp may be ignored or hunted."],
  ["species_to_avoid", "Species to avoid", "Never combine adult male bettas. Avoid fin-nipping fish, aggressive or territorial species, fish with similar long fins or intense displays, and companions large enough to injure or eat the betta. Tiger barbs and many larger cichlids are poor choices. Gouramis can also trigger territorial conflict because they occupy similar areas and share related display behavior."],
  ["diet_and_feeding", "Diet and feeding", "Bettas are specialized micropredators that naturally consume zooplankton, mosquito larvae, and other small animal prey. Feed a quality betta pellet or other appropriately sized high-protein staple in small measured portions once or twice daily. Rotate suitable frozen or live foods such as brine shrimp, daphnia, or bloodworms as supplements, not an unbalanced sole diet. Remove leftovers and adjust portions to the fish's body condition; routine overfeeding promotes waste and digestive problems."],
  ["common_health_concerns", "Common health concerns", "Common warning signs include appetite loss, lethargy, rapid breathing, clamped or deteriorating fins, abnormal swelling, white spots, fuzzy growth, color change, or unusual swimming. First verify temperature, ammonia, nitrite, nitrate, and recent maintenance because environmental problems commonly underlie illness. Isolate contagious or bullied fish when appropriate and consult an aquatic veterinarian or experienced fish-health professional for diagnosis. Do not medicate blindly or replace good husbandry with salt or bottled remedies."],
  ["breeding", "Breeding", "Betta splendens is a bubble-nest builder. A conditioned male constructs and guards a surface nest; spawning involves courtship and egg placement in that nest. Breeding requires separate conditioning and grow-out space, close supervision because the pair may injure one another, a plan for many juveniles, and responsible placement of offspring. It is not recommended as a casual beginner project."],
  ["beginner_guidance", "Beginner guidance", "Cycle the aquarium before relying on it to process fish waste, condition all tap water, and test water regularly. Each day, check the fish, temperature, filter flow, and appetite. A common starting routine is a 20–30% weekly water change, adjusted to measured nitrate and stocking. Never replace all water or scrub the entire tank at once. Choose a healthy fish with clear eyes, intact fins, steady swimming, and interest in food, and keep a simple log of test results and maintenance."],
  ["frequently_asked_questions", "Frequently asked questions", "Can a betta live in a bowl? A bowl usually lacks the stable heat, filtration, swimming space, and enrichment needed for good welfare. Use a heated, filtered aquarium instead. Does a betta need a heater? Usually yes; stability within the tropical range matters even when daytime room temperature seems warm. Does a betta need a companion? No. A betta can thrive alone, and another betta may create severe aggression. Why does a betta gulp air? Bettas possess a labyrinth organ and normally breathe at the surface, but unusually frequent or distressed breathing still warrants water-quality and health checks."],
];

const quickFacts = {
  scientific_name: "Betta splendens",
  adult_size: "2.5–3 inches (6–7.5 cm), excluding exaggerated ornamental fin length",
  lifespan: "Typically 3–5 years in well-maintained captivity",
  minimum_tank_size: "5 US gallons (19 L); 10 gallons is easier to stabilize",
  care_level: "Beginner-friendly with a cycled, heated, filtered aquarium",
  temperament: "Territorial; keep adult males separately",
  diet: "Carnivorous/insectivorous; high-protein betta foods with varied frozen or live supplements",
  social_requirements: "Solitary; not a schooling fish",
  temperature_range: "76–81°F (24.5–27°C) practical captive target",
  ph_range: "6.5–7.8 practical target; stability is more important than chasing a number",
};

const sourceRecords = [
  {
    title: "Betta splendens summary page",
    publisher: "FishBase",
    author: "Froese, R. and Pauly, D. (editors)",
    url: "https://www.fishbase.se/summary/Betta_splendens.html",
    source_type: "database",
    accessed_date: "2026-07-17",
  },
  {
    title: "Life in a fishbowl: Space and environmental enrichment affect behaviour of Betta splendens",
    publisher: "Animal Welfare / Cambridge University Press",
    author: "Elwood et al.",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10936361/",
    publication_date: "2024-01-01",
    accessed_date: "2026-07-17",
    source_type: "journal",
  },
  {
    title: "Care and Use of Siamese Fighting Fish (Betta splendens) for Research",
    publisher: "Journal of the American Association for Laboratory Animal Science",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9334006/",
    publication_date: "2022-07-01",
    accessed_date: "2026-07-17",
    source_type: "journal",
  },
  {
    title: "Betta Fish Care Sheet",
    publisher: "PetMD",
    author: "Maria Zayas, DVM",
    url: "https://www.petmd.com/fish/betta-fish-care-sheet",
    publication_date: "2026-04-27",
    accessed_date: "2026-07-17",
    source_type: "website",
  },
];

async function requireData(result, operation) {
  if (result.error) throw new Error(`${operation}: ${result.error.message}`);
  return result.data;
}

async function uploadGuideImage(speciesId, filename, storageName, metadata) {
  const localPath = path.join(process.cwd(), "assets", "processed", filename);
  const storagePath = `care-guides/${speciesId}/${storageName}`;
  const bytes = fs.readFileSync(localPath);
  const upload = await supabase.storage.from("content-images").upload(storagePath, bytes, {
    contentType: "image/png",
    upsert: true,
  });
  if (upload.error) throw new Error(`Upload ${filename}: ${upload.error.message}`);

  return requireData(
    await supabase.from("content_images").upsert({
      species_id: speciesId,
      storage_path: storagePath,
      mime_type: "image/png",
      file_size_bytes: bytes.length,
      width: 1536,
      height: 1024,
      attribution: "AI-generated original for GuideMyTank",
      license_name: "Original GuideMyTank asset",
      ...metadata,
    }, { onConflict: "storage_path" }).select("*").single(),
    `Save metadata for ${filename}`,
  );
}

async function verifyGuide(guideId) {
  const [guide, sections, images, sources] = await Promise.all([
    supabase.from("care_guides").select("id,status,slug,title,published_at,open_graph_image_id").eq("id", guideId).single(),
    supabase.from("care_guide_sections").select("id", { count: "exact", head: true }).eq("care_guide_id", guideId),
    supabase.from("care_guide_images").select("image_id,is_primary,content_images(alt_text,species_id)").eq("care_guide_id", guideId),
    supabase.from("care_guide_sources").select("source_id", { count: "exact", head: true }).eq("care_guide_id", guideId),
  ]);
  const savedGuide = await requireData(guide, "Verify Care Guide");
  await requireData(sections, "Verify sections");
  const savedImages = await requireData(images, "Verify images");
  await requireData(sources, "Verify sources");
  if (savedGuide.status !== "published" || sections.count !== 19 || savedImages.length < 2 || savedImages.filter((item) => item.is_primary).length !== 1 || sources.count < 1) {
    throw new Error("Betta Care Guide verification failed.");
  }
  console.log(`Verified status=${savedGuide.status}; sections=${sections.count}; images=${savedImages.length}; primary=1; sources=${sources.count}`);
}

async function main() {
  const species = await requireData(
    await supabase.from("species").select("id,slug,common_name,scientific_name").eq("slug", "betta-splendens").single(),
    "Find Betta splendens",
  );

  let guide = await requireData(
    await supabase.from("care_guides").select("*").eq("species_id", species.id).maybeSingle(),
    "Check existing Care Guide",
  );

  if (guide?.status === "published" && process.env.REFRESH_BETTA_IMAGES !== "1") {
    console.log(`Betta Care Guide is already published (${guide.id}).`);
    await verifyGuide(guide.id);
    return;
  }

  if (guide?.status === "published") {
    guide = await requireData(
      await supabase.from("care_guides").update({ status: "archived" }).eq("id", guide.id).select("*").single(),
      "Archive Care Guide before refreshing images",
    );
  }

  const guideValues = {
    species_id: species.id,
    title: "Betta Splendens Care Guide",
    slug: "betta-splendens",
    summary: "A practical, evidence-informed guide to housing, feeding, behavior, tank mates, health, and long-term care for Betta splendens.",
    status: "draft",
    seo_title: "Betta Fish Care Guide: Tank, Diet & Health",
    meta_description: "Learn how to care for Betta splendens with practical guidance on tank size, temperature, filtration, feeding, behavior, health, and tank mates.",
    canonical_url: "https://www.guidemytank.com/care-guides/betta-splendens",
    is_featured: true,
    quick_facts: quickFacts,
  };

  if (guide) {
    guide = await requireData(await supabase.from("care_guides").update(guideValues).eq("id", guide.id).select("*").single(), "Update Care Guide draft");
  } else {
    guide = await requireData(await supabase.from("care_guides").insert(guideValues).select("*").single(), "Create Care Guide draft");
  }

  await requireData(await supabase.from("care_guide_sections").upsert(
    sections.map(([section_type, heading, text], display_order) => ({ care_guide_id: guide.id, section_type, heading, content: { text }, display_order })),
    { onConflict: "care_guide_id,section_type" },
  ), "Save Care Guide sections");

  const heroImage = await uploadGuideImage(species.id, "betta-care-guide-habitat.png", "betta-habitat-hero.png", {
    alt_text: "Blue and red Betta splendens swimming in a spacious planted aquarium",
    caption: "A planted, gently filtered aquarium provides cover, resting areas, and clear surface access.",
  });
  const portraitImage = await uploadGuideImage(species.id, "betta-care-guide-portrait.png", "betta-splendens-portrait.png", {
    alt_text: "Blue and red male Betta splendens swimming among aquatic plants",
    caption: "An adult male Betta splendens showing the species' distinctive body shape and flowing fins.",
  });

  await requireData(await supabase.from("care_guide_images").delete().eq("care_guide_id", guide.id), "Reset Care Guide image order");
  await requireData(await supabase.from("care_guide_images").insert([
    { care_guide_id: guide.id, image_id: heroImage.id, is_primary: true, display_order: 0 },
    { care_guide_id: guide.id, image_id: portraitImage.id, is_primary: false, display_order: 1 },
  ]), "Attach Care Guide images");

  const savedSources = [];
  for (const source of sourceRecords) {
    const existingSource = await requireData(
      await supabase.from("sources").select("id").eq("url", source.url).maybeSingle(),
      `Find source ${source.title}`,
    );
    savedSources.push(await requireData(
      existingSource
        ? await supabase.from("sources").update(source).eq("id", existingSource.id).select("*").single()
        : await supabase.from("sources").insert(source).select("*").single(),
      `Save source ${source.title}`,
    ));
  }
  await requireData(await supabase.from("care_guide_sources").delete().eq("care_guide_id", guide.id), "Reset Care Guide sources");
  await requireData(await supabase.from("care_guide_sources").insert(savedSources.map((source, display_order) => ({
    care_guide_id: guide.id,
    source_id: source.id,
    citation_label: display_order === 0 ? "Species biology and native range" : display_order === 1 ? "Space and enrichment welfare evidence" : display_order === 2 ? "Husbandry and behavior review" : "Veterinary care overview",
    display_order,
  }))), "Attach Care Guide sources");

  await requireData(await supabase.from("care_guides").update({
    open_graph_image_id: heroImage.id,
    status: "published",
    published_at: new Date().toISOString(),
  }).eq("id", guide.id).select("id,status,published_at").single(), "Publish Betta Care Guide");

  console.log(`Published Betta Splendens Care Guide: ${guide.id}`);
  console.log(`Sections: ${sections.length}; images: 2; sources: ${savedSources.length}`);
  await verifyGuide(guide.id);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

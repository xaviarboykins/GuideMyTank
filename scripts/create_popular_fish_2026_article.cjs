/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");
const { createClient } = require("@supabase/supabase-js");

for (const line of fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8").split(/\r?\n/)) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
}
const supabase = createClient(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const slug = "most-popular-freshwater-aquarium-fish-2026";
const blocks = [
  ["paragraph", { text: "The most popular freshwater aquarium fish in 2026 are not defined by one complete worldwide sales chart. Availability differs by country, and popularity does not automatically mean a fish is easy or suitable for every tank. This guide uses a practical convergence of current veterinary guidance, ornamental-fish trade reporting, long-term retail availability, and recurring beginner interest. Guppies, bettas, neon tetras, mollies, corydoras, platies, zebra danios, angelfish, bristlenose plecos, and goldfish remain the names most aquarists are likely to encounter." }],
  ["heading", { text: "The 10 Popular Freshwater Fish to Know in 2026", level: 2 }],
  ["comparison_table", { headers: ["Fish", "Best role", "Social need", "Important planning point"], rows: [
    ["Guppy", "Colorful community fish", "Keep an appropriate group", "Plan for frequent reproduction or keep a single sex"],
    ["Betta splendens", "Solo centerpiece", "Usually solitary", "Needs a heated, filtered aquarium and gentle flow"],
    ["Neon tetra", "Small schooling display", "Keep a proper school", "Add only to a mature, stable aquarium"],
    ["Corydoras", "Active bottom-dwelling group", "Keep a same-species group", "Choose species-appropriate tank dimensions and smooth substrate"],
    ["Molly", "Larger livebearer", "Social group", "Prefers harder, mineral-rich water and produces many fry"],
    ["Platy", "Beginner community fish", "Social group", "Another prolific livebearer; avoid overcrowding"],
    ["Zebra danio", "Fast, active school", "Keep a proper school", "Needs horizontal swimming room"],
    ["Freshwater angelfish", "Large centerpiece cichlid", "Context dependent", "Adult size and territorial behavior require a larger plan"],
    ["Bristlenose pleco", "Bottom-oriented feature fish", "Often kept singly", "Still produces waste and needs food beyond incidental algae"],
    ["Goldfish", "Cool-water feature fish", "Social when space permits", "Requires a large, heavily filtered long-term aquarium—not a bowl"]
  ] }],
  ["heading", { text: "1. Guppies: the enduring colorful favorite", level: 2 }],
  ["paragraph", { text: "Guppies remain one of the clearest answers to searches for popular freshwater fish. A 2024 USDA Agricultural Research Service summary calls the guppy one of the most common cultured ornamental species and notes its worldwide popularity, while current veterinary guidance continues to describe guppies as popular beginner fish. Their color diversity, small adult size, activity, and broad retail availability explain the appeal. The catch is reproduction: mixed-sex groups can quickly produce more fish than a tank can support. Stable warm water, a varied omnivorous diet, sensible group planning, and a strategy for fry matter more than the label ‘easy.’" }],
  ["heading", { text: "2. Betta fish: the recognizable solo centerpiece", level: 2 }],
  ["paragraph", { text: "Betta splendens stays popular because one fish can provide color, visible behavior, and a strong focal point without a community stocking plan. A betta is not a bowl decoration. It needs a cycled, heated, filtered aquarium with surface access, gentle flow, cover, and enough room to explore. Adult males should not be housed together. Bettas suit keepers who want one highly visible fish and are prepared to maintain tropical conditions consistently." }],
  ["heading", { text: "3. Neon tetras: the classic schooling display", level: 2 }],
  ["paragraph", { text: "Neon tetras remain a defining community-aquarium fish. WWF trade reporting identifies neon tetras, guppies, and mollies among the most common species in a market dominated by a relatively small number of fish. Their blue-and-red stripe becomes most effective when the fish are kept as a real school rather than a token trio. They benefit from a mature aquarium, stable water, peaceful companions, subdued areas, and adequate horizontal swimming room." }],
  ["heading", { text: "4. Corydoras: popular bottom dwellers that need a group", level: 2 }],
  ["paragraph", { text: "Corydoras catfish combine constant activity with generally peaceful behavior, making them popular in community tanks. ‘Corydoras’ covers many species with different adult sizes and temperature preferences, so buyers should identify the exact species. They are social fish, not disposable cleanup tools. Keep a suitable same-species group, provide smooth substrate and appropriate floor space, and feed sinking foods directly rather than expecting leftovers to provide a complete diet." }],
  ["heading", { text: "5–7. Mollies, platies, and zebra danios", level: 2 }],
  ["paragraph", { text: "Mollies and platies remain widely available livebearers. Both can be colorful, active community fish, but both reproduce readily. Mollies are larger and usually perform best in harder, mineral-rich water; they should not be treated as a universal match for every soft-water community. Platies are compact and adaptable, but population control still matters. Zebra danios offer a different experience: a fast-moving school that rewards generous horizontal swimming space and can overwhelm very slow or long-finned companions." }],
  ["heading", { text: "8–10. Angelfish, bristlenose plecos, and goldfish", level: 2 }],
  ["paragraph", { text: "These three popular fish are often underestimated. Freshwater angelfish are cichlids that grow tall, become territorial, and may eat fish small enough to swallow. Bristlenose plecos are smaller than common plecos but still need appropriate food, wood and cover where suitable, clean oxygenated water, and room for their waste load. Goldfish are cool-water fish with substantial adult size and filtration needs. Their familiarity has encouraged unsuitable bowl keeping; a long-term goldfish aquarium requires far more volume and maintenance than a small tropical-fish setup." }],
  ["heading", { text: "How to choose among popular aquarium fish", level: 2 }],
  ["list", { ordered: true, items: [
    "Start with the adult fish, not the juvenile size displayed at the store.",
    "Match temperature, hardness, pH, activity level, and temperament—not just appearance.",
    "Count the full social group when calculating tank space and biological load.",
    "Cycle the aquarium before stocking and add fish gradually.",
    "Plan for reproduction before buying livebearers.",
    "Confirm that every fish receives an appropriate diet; no fish lives on waste alone.",
    "Use popularity as a research starting point, never as proof of compatibility."
  ] }],
  ["warning", { text: "Do not combine all ten fish in one aquarium. This is a popularity guide, not a stocking recipe. Goldfish and tropical community fish have different temperature and space requirements, angelfish may prey on small fish, betta compatibility varies, and every schooling species needs its own adequate group." }],
  ["heading", { text: "What is changing in aquarium interest in 2026?", level: 2 }],
  ["paragraph", { text: "The enduring favorites remain visible, but better-informed keepers increasingly evaluate welfare, planted-tank compatibility, captive breeding, adult size, and long-term maintenance rather than asking only which fish is hardest to kill. Small does not mean effortless, and ‘cleanup fish’ is not a husbandry category. The strongest 2026 stocking plan is therefore not the trendiest list; it is a short list of compatible species whose complete needs fit the same aquarium." }],
  ["faq_group", { items: [
    { question: "What is the most popular freshwater aquarium fish in 2026?", answer: "No single audited global ranking settles the question. Guppies, bettas, and neon tetras have the strongest combination of long-term trade prominence, recognition, retail availability, and current beginner interest." },
    { question: "What is the best popular fish for a beginner?", answer: "The best choice depends on tank size, water chemistry, and whether the keeper wants one fish or a social group. A properly housed betta, a planned single-sex guppy group, platies, or a suitably sized danio school can work, but none removes the need to cycle and maintain the aquarium." },
    { question: "Can popular community fish all live together?", answer: "No. Shared popularity does not guarantee compatible temperature, behavior, adult size, or group requirements. Build a stocking plan around one aquarium’s conditions." },
    { question: "Are goldfish beginner fish?", answer: "Goldfish are familiar and trainable, but their adult size, waste production, lifespan, and space requirements make proper long-term care more demanding than a bowl or small starter kit suggests." }
  ] }]
];

const sources = [
  { title: "The World's Forgotten Fishes", publisher: "World Wildlife Fund", url: "https://www.worldwildlife.org/documents/1609/wwfintl_freshwater_fishes_report.pdf", source_type: "organization", accessed_date: "2026-07-17" },
  { title: "Diagnosis, isolation, and description of a novel amnoonvirus recovered from diseased fancy guppies", publisher: "USDA Agricultural Research Service", url: "https://www.ars.usda.gov/research/publications/publication/?seqNo115=411280", source_type: "journal", accessed_date: "2026-07-17" },
  { title: "The 7 Best Aquarium Fish for Beginners", publisher: "PetMD", url: "https://www.petmd.com/fish/care/best-aquarium-fish-for-beginners", source_type: "website", accessed_date: "2026-07-17" },
  { title: "Guppy Fish Care Sheet", publisher: "PetMD", author: "Maria Zayas, DVM", url: "https://www.petmd.com/fish/guppy-fish-care-sheet", source_type: "website", accessed_date: "2026-07-17" }
];

const images = [
  ["01-guppy.png", "Fancy guppies swimming in a planted freshwater aquarium", "Guppies remain colorful, widely available favorites in 2026."],
  ["02-betta.png", "Blue and red male Betta splendens swimming among aquatic plants", "Betta splendens is a recognizable solo centerpiece fish."],
  ["03-neon-tetra.png", "School of neon tetras displaying blue and red lateral stripes", "Neon tetras create their strongest display when kept as a proper school."],
  ["04-corydoras.png", "Group of bronze corydoras catfish foraging over smooth sand", "Corydoras are social bottom dwellers that require suitable groups and direct feeding."],
  ["05-molly.png", "Black and dalmatian mollies swimming in a planted aquarium", "Mollies are larger livebearers that generally favor mineral-rich water."],
  ["06-platy.png", "Red wagtail and sunset platies in a freshwater aquarium", "Platies are colorful livebearers whose reproduction requires advance planning."],
  ["07-zebra-danio.png", "Active school of striped zebra danios", "Zebra danios reward generous horizontal swimming space."],
  ["08-angelfish.png", "Adult silver freshwater angelfish with black vertical bars", "Freshwater angelfish grow tall and may become territorial as adults."],
  ["09-bristlenose-pleco.png", "Bristlenose pleco resting on natural aquarium driftwood", "Bristlenose plecos need appropriate food and are not simply aquarium cleaners."],
  ["10-goldfish.png", "Two common goldfish swimming in a spacious cool-water aquarium", "Goldfish require substantial long-term space and filtration rather than bowls."]
];

async function required(result, label) { if (result.error) throw new Error(`${label}: ${result.error.message}`); return result.data; }

async function main() {
  let article = await required(await supabase.from("articles").select("*").eq("slug", slug).maybeSingle(), "Find article");
  if (article?.status === "published" && process.env.REFRESH_POPULAR_FISH_IMAGES !== "1") {
    const sections = await required(await supabase.from("article_sections").select("id", { count: "exact" }).eq("article_id", article.id), "Verify sections");
    console.log(`Article already published (${article.id}); sections=${sections.length}.`);
    return;
  }
  if (article?.status === "published") article = await required(await supabase.from("articles").update({ status: "archived" }).eq("id", article.id).select("*").single(), "Archive article for image update");
  const values = { title: "Most Popular Freshwater Aquarium Fish in 2026", slug, summary: "A practical look at ten of 2026's most popular freshwater aquarium fish, why aquarists choose them, and the care requirements beginners should understand before buying.", status: "draft", seo_title: "10 Most Popular Freshwater Aquarium Fish in 2026", meta_description: "Compare 10 popular freshwater aquarium fish for 2026, including guppies, bettas, neon tetras, corydoras, mollies, platies, danios, and more.", canonical_url: `https://www.guidemytank.com/articles/${slug}`, is_featured: true };
  article = article ? await required(await supabase.from("articles").update(values).eq("id", article.id).select("*").single(), "Update draft") : await required(await supabase.from("articles").insert(values).select("*").single(), "Create draft");
  await required(await supabase.from("article_sections").delete().eq("article_id", article.id), "Reset sections");
  await required(await supabase.from("article_sections").insert(blocks.map(([block_type, content], display_order) => ({ article_id: article.id, block_type, content, display_order }))), "Create sections");
  const savedSources = [];
  for (const source of sources) {
    let saved = await required(await supabase.from("sources").select("id").eq("url", source.url).maybeSingle(), "Find source");
    if (!saved) saved = await required(await supabase.from("sources").insert(source).select("id").single(), "Create source");
    savedSources.push(saved);
  }
  await required(await supabase.from("article_sources").delete().eq("article_id", article.id), "Reset sources");
  await required(await supabase.from("article_sources").insert(savedSources.map((source, display_order) => ({ article_id: article.id, source_id: source.id, display_order }))), "Attach sources");
  const savedImages = [];
  for (const [fileName, alt_text, caption] of images) {
    const filePath = path.join(process.cwd(), "assets", "processed", "popular-fish-2026", fileName);
    const storagePath = `articles/${article.id}/${fileName}`;
    await required(await supabase.storage.from("content-images").upload(storagePath, fs.readFileSync(filePath), { contentType: "image/png", upsert: true }), `Upload ${fileName}`);
    let image = await required(await supabase.from("content_images").select("id").eq("storage_path", storagePath).maybeSingle(), `Find ${fileName} metadata`);
    const metadata = { storage_path: storagePath, alt_text, caption, attribution: "AI-generated original editorial image", license_name: "GuideMyTank original", mime_type: "image/png", file_size_bytes: fs.statSync(filePath).size };
    image = image ? await required(await supabase.from("content_images").update(metadata).eq("id", image.id).select("id").single(), `Update ${fileName} metadata`) : await required(await supabase.from("content_images").insert(metadata).select("id").single(), `Create ${fileName} metadata`);
    savedImages.push(image);
  }
  await required(await supabase.from("article_images").delete().eq("article_id", article.id), "Reset article images");
  await required(await supabase.from("article_images").insert(savedImages.map((image, display_order) => ({ article_id: article.id, image_id: image.id, display_order }))), "Attach article images");
  article = await required(await supabase.from("articles").update({ featured_image_id: savedImages[0].id, open_graph_image_id: savedImages[0].id, status: "published", published_at: new Date().toISOString() }).eq("id", article.id).select("id,status").single(), "Publish article");
  console.log(`Published ${article.id}: sections=${blocks.length}; sources=${savedSources.length}; images=${savedImages.length}.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });

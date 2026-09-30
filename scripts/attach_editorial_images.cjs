/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");
const { createClient } = require("@supabase/supabase-js");

for (const line of fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8").split(/\r?\n/)) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
}

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const images = [
  {
    articleSlug: "how-to-cycle-a-freshwater-aquarium",
    file: "aquarium-sponge-filter-foam.jpg",
    alt: "Close view of porous aquarium sponge-filter foam used as biological filter media",
    caption: "Porous sponge provides surface area for an aquarium biofilter while also trapping debris.",
    attribution: "Ofkun / Wikimedia Commons",
    author: "Ofkun",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Aquarium_Sponge_Filter_foam_1.jpg",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  },
  {
    articleSlug: "how-to-plan-a-freshwater-community-tank",
    file: "freshwater-community-aquarium.jpg",
    alt: "Large planted freshwater aquarium containing small fish at multiple swimming levels",
    caption: "A community aquarium must provide compatible water conditions, swimming space, cover, and appropriate social groups.",
    attribution: "Netha Hussain / Wikimedia Commons",
    author: "Netha Hussain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:A_freshwater_aquarium_containing_plants_and_small_fish.jpg",
    licenseName: "CC0 1.0 Universal",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
  },
  {
    articleSlug: "freshwater-fish-quarantine-routine",
    file: "air-pump-and-stone.jpg",
    alt: "Aquarium air pump connected by tubing to a cylindrical air stone",
    caption: "Dedicated aeration equipment is useful in a simple quarantine setup and should not be shared wet between systems.",
    attribution: "Ofkun / Wikimedia Commons",
    author: "Ofkun",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Air_pump_and_stone.jpg",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  },
];

async function required(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

async function attachImage(definition) {
  const article = await required(
    await supabase.from("articles").select("id,status,published_at").eq("slug", definition.articleSlug).eq("status", "published").single(),
    `Load ${definition.articleSlug}`,
  );
  const filePath = path.join(process.cwd(), "assets", "editorial", "licensed", definition.file);
  const file = fs.readFileSync(filePath);
  const metadata = await sharp(file).metadata();
  const storagePath = `articles/${article.id}/${definition.file}`;

  await required(
    await supabase.storage.from("content-images").upload(storagePath, file, { contentType: "image/jpeg", upsert: true }),
    `Upload ${definition.file}`,
  );

  const values = {
    storage_path: storagePath,
    alt_text: definition.alt,
    caption: definition.caption,
    attribution: definition.attribution,
    author: definition.author,
    source_url: definition.sourceUrl,
    license_name: definition.licenseName,
    license_url: definition.licenseUrl,
    mime_type: "image/jpeg",
    file_size_bytes: file.length,
    width: metadata.width ?? null,
    height: metadata.height ?? null,
  };
  let image = await required(await supabase.from("content_images").select("id").eq("storage_path", storagePath).maybeSingle(), `Find ${definition.file}`);
  image = image
    ? await required(await supabase.from("content_images").update(values).eq("id", image.id).select("id").single(), `Update ${definition.file}`)
    : await required(await supabase.from("content_images").insert(values).select("id").single(), `Create ${definition.file}`);

  await required(await supabase.from("articles").update({ status: "archived" }).eq("id", article.id), `Archive ${definition.articleSlug} for image assignment`);
  await required(await supabase.from("article_images").delete().eq("article_id", article.id).eq("image_id", image.id), `Reset ${definition.file} assignment`);
  const assignments = await required(await supabase.from("article_images").select("display_order").eq("article_id", article.id).order("display_order", { ascending: false }).limit(1), `Load image order ${definition.articleSlug}`);
  const displayOrder = assignments.length ? assignments[0].display_order + 1 : 0;
  await required(await supabase.from("article_images").insert({ article_id: article.id, image_id: image.id, display_order: displayOrder }), `Attach ${definition.file}`);
  await required(await supabase.from("articles").update({ featured_image_id: image.id, open_graph_image_id: image.id, status: "published", published_at: article.published_at }).eq("id", article.id), `Set featured image ${definition.articleSlug}`);
  console.log(`ATTACHED ${definition.file} -> ${definition.articleSlug} (${metadata.width}x${metadata.height}, ${definition.licenseName})`);
}

async function setExistingGuideFeaturedImage() {
  const guideId = "6586fba7-2bb9-4e31-a61c-2803692efc87";
  const guide = await required(await supabase.from("articles").select("published_at").eq("id", guideId).single(), "Load comparison guide publication date");
  const assignments = await required(await supabase.from("article_images").select("image_id,display_order").eq("article_id", guideId).order("display_order").limit(1), "Load comparison guide image");
  if (!assignments.length) throw new Error("Betta vs Guppy has no existing image to feature.");
  await required(await supabase.from("articles").update({ status: "archived" }).eq("id", guideId), "Archive comparison guide for image assignment");
  await required(await supabase.from("articles").update({ featured_image_id: assignments[0].image_id, open_graph_image_id: assignments[0].image_id, status: "published", published_at: guide.published_at }).eq("id", guideId), "Set comparison guide featured image");
  console.log("FEATURED existing Betta vs Guppy image");
}

async function main() {
  for (const image of images) await attachImage(image);
  await setExistingGuideFeaturedImage();
}

main().catch((error) => { console.error(error); process.exitCode = 1; });

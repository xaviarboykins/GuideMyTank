/* eslint-disable @typescript-eslint/no-require-imports */

const { createClient } = require("@supabase/supabase-js");
const sharp = require("sharp");

const { loadLocalEnv } = require("./load_env_file.cjs");

const root = process.cwd();
loadLocalEnv(root);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL and a Supabase key are required.",
  );
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const { data: images, error } = await supabase
    .from("content_images")
    .select("id,storage_path,width,height")
    .or("width.is.null,height.is.null")
    .order("created_at");

  if (error) {
    throw new Error(`Unable to load image metadata: ${error.message}`);
  }

  let repaired = 0;
  const failures = [];

  for (const image of images ?? []) {
    const { data, error: downloadError } = await supabase.storage
      .from("content-images")
      .download(image.storage_path);

    if (downloadError || !data) {
      failures.push(`${image.storage_path}: download failed`);
      continue;
    }

    try {
      const metadata = await sharp(Buffer.from(await data.arrayBuffer())).metadata();
      if (!metadata.width || !metadata.height) {
        failures.push(`${image.storage_path}: dimensions unavailable`);
        continue;
      }

      const { error: updateError } = await supabase
        .from("content_images")
        .update({ width: metadata.width, height: metadata.height })
        .eq("id", image.id);

      if (updateError) {
        failures.push(`${image.storage_path}: ${updateError.message}`);
        continue;
      }

      repaired += 1;
    } catch (repairError) {
      failures.push(
        `${image.storage_path}: ${
          repairError instanceof Error ? repairError.message : "repair failed"
        }`,
      );
    }
  }

  console.log(`Images missing dimensions: ${images?.length ?? 0}`);
  console.log(`Images repaired: ${repaired}`);
  console.log(`Failures: ${failures.length}`);
  for (const failure of failures) console.error(`- ${failure}`);

  if (failures.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require("node:fs");
const path = require("node:path");
const { createClient } = require("@supabase/supabase-js");
const { loadLocalEnv } = require("./load_env_file.cjs");

const root = path.resolve(__dirname, "..");
loadLocalEnv(root);

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL and key are required.");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function selectAll(table, orderColumn) {
  const { data, error } = await supabase.from(table).select("*").order(orderColumn);
  if (error) {
    throw new Error(`${table} backup failed: ${error.message}`);
  }
  return data || [];
}

async function main() {
  const [species, aliases, sourceReferences] = await Promise.all([
    selectAll("species", "slug"),
    selectAll("species_aliases", "species_id"),
    selectAll("species_source_references", "species_id"),
  ]);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outputDirectory = path.join(root, "reports", "species", "backups");
  const outputPath = path.join(
    outputDirectory,
    `species-pre-sync-${timestamp}.json`,
  );
  const snapshot = {
    generatedAt: new Date().toISOString(),
    tables: {
      species,
      species_aliases: aliases,
      species_source_references: sourceReferences,
    },
  };

  fs.mkdirSync(outputDirectory, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`);

  console.log("GuideMyTank Species pre-sync snapshot");
  console.log(`Species: ${species.length}`);
  console.log(`Aliases: ${aliases.length}`);
  console.log(`Source references: ${sourceReferences.length}`);
  console.log(`Snapshot: ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

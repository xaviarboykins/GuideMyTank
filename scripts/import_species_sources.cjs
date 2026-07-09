/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require("fs");
const path = require("path");
const { loadLocalEnv } = require("./load_env_file.cjs");

const rootDir = path.resolve(__dirname, "..");
const sourcesPath = path.join(rootDir, "data", "import", "species.sources.json");
loadLocalEnv(rootDir);

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase credentials. Set SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return { url: url.replace(/\/$/, ""), key };
}

async function request(table, query, options = {}) {
  const { url, key } = getSupabaseConfig();
  const response = await fetch(`${url}/rest/v1/${table}${query}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`${options.method || "GET"} ${table} failed: ${response.status} ${detail}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function sourceCategoryForUrl(url) {
  if (url.includes("wikipedia.org/wiki/")) return "taxonomy";
  return "care";
}

function sourceLabelForUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const sourcesPayload = JSON.parse(fs.readFileSync(sourcesPath, "utf8"));
  const sourceEntries = sourcesPayload.species || {};
  const slugs = Object.keys(sourceEntries);
  const rows = [];

  if (dryRun) {
    const sourceCount = slugs.reduce(
      (total, slug) => total + (sourceEntries[slug].sources?.length || 0),
      0,
    );
    console.log(`Dry run: ${sourceCount} source references ready for ${slugs.length} species.`);
    return;
  }

  for (const slug of slugs) {
    const speciesRows = await request(
      "species",
      `?select=id,slug&slug=eq.${encodeURIComponent(slug)}`,
    );
    if (!speciesRows || speciesRows.length !== 1) {
      throw new Error(`Could not find remote species '${slug}'.`);
    }

    for (const sourceUrl of sourceEntries[slug].sources || []) {
      rows.push({
        species_id: speciesRows[0].id,
        source_url: sourceUrl,
        source_label: sourceLabelForUrl(sourceUrl),
        source_category: sourceCategoryForUrl(sourceUrl),
        confidence: "medium",
        notes: sourceEntries[slug].category_batch
          ? `Imported from ${sourceEntries[slug].category_batch} source batch.`
          : null,
      });
    }
  }

  for (const row of rows) {
    await request(
      "species_source_references",
      `?species_id=eq.${row.species_id}&source_url=eq.${encodeURIComponent(
        row.source_url,
      )}&source_category=eq.${row.source_category}`,
      { method: "DELETE" },
    );
  }

  if (rows.length > 0) {
    await request("species_source_references", "", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(rows),
    });
  }

  console.log(`Imported ${rows.length} species source references.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require("fs");
const path = require("path");
const { loadLocalEnv } = require("./load_env_file.cjs");

const rootDir = path.resolve(__dirname, "..");
const speciesPath = path.join(rootDir, "data", "import", "species.master.json");
const overridesPath = path.join(rootDir, "data", "compatibility", "expert-overrides.json");
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

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const speciesPayload = loadJson(speciesPath);
  const overridesPayload = loadJson(overridesPath);
  const localSpecies = speciesPayload.species || speciesPayload;
  const remoteSpeciesRows = await request("species", "?select=id,slug");
  const existingExpertRules = await request(
    "compatibility_rules",
    "?select=id,species_a_id,species_b_id&expert_validated=eq.true",
  );
  const speciesBySlug = new Map(remoteSpeciesRows.map((row) => [row.slug, row]));
  const speciesById = new Map(remoteSpeciesRows.map((row) => [row.id, row]));
  const desiredPairKeys = new Set(
    overridesPayload.overrides.map((override) =>
      [...override.species].sort().join("|"),
    ),
  );

  for (const override of overridesPayload.overrides) {
    for (const slug of override.species) {
      if (!speciesBySlug.has(slug)) {
        const localMatch = localSpecies.find((item) => item.slug === slug);
        throw new Error(
          `Could not find remote species '${slug}'${localMatch ? ` (${localMatch.common_name})` : ""}.`,
        );
      }
    }
  }

  const staleExpertRules = existingExpertRules.filter((rule) => {
    const speciesA = speciesById.get(rule.species_a_id);
    const speciesB = speciesById.get(rule.species_b_id);
    const pairKey =
      speciesA && speciesB
        ? [speciesA.slug, speciesB.slug].sort().join("|")
        : null;

    return !pairKey || !desiredPairKeys.has(pairKey);
  });

  console.log(
    `${dryRun ? "Dry run: " : ""}${overridesPayload.overrides.length} expert overrides will be synchronized; ${staleExpertRules.length} stale expert rows will be removed.`,
  );
  if (dryRun) return;

  for (const staleRule of staleExpertRules) {
    await request(
      "compatibility_rules",
      `?id=eq.${encodeURIComponent(staleRule.id)}`,
      { method: "DELETE" },
    );
  }

  for (const override of overridesPayload.overrides) {
    const [speciesASlug, speciesBSlug] = [...override.species].sort();
    const speciesAId = speciesBySlug.get(speciesASlug).id;
    const speciesBId = speciesBySlug.get(speciesBSlug).id;
    const deleteQuery =
      `?or=(` +
      `and(species_a_id.eq.${speciesAId},species_b_id.eq.${speciesBId}),` +
      `and(species_a_id.eq.${speciesBId},species_b_id.eq.${speciesAId})` +
      `)`;

    await request("compatibility_rules", deleteQuery, { method: "DELETE" });
    await request("compatibility_rules", "", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        species_a_id: speciesAId,
        species_b_id: speciesBId,
        compatibility: override.compatibility,
        confidence: override.confidence,
        notes: override.notes,
        expert_validated: override.expert_validated,
        expert_notes: override.expert_notes || null,
      }),
    });
  }

  console.log(
    `Synchronized ${overridesPayload.overrides.length} expert overrides and removed ${staleExpertRules.length} stale expert rows.`,
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

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

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function normalize(value) {
  if (Array.isArray(value)) {
    return [...value].sort((left, right) =>
      JSON.stringify(left).localeCompare(JSON.stringify(right)),
    );
  }
  return value;
}

function valuesMatch(left, right) {
  return JSON.stringify(normalize(left)) === JSON.stringify(normalize(right));
}

function sourceCategoryForUrl(url) {
  return url.includes("wikipedia.org/wiki/") ? "taxonomy" : "care";
}

function issue(slug, field, severity, code, message, localValue, databaseValue) {
  return {
    slug,
    field,
    severity,
    code,
    message,
    localValue,
    databaseValue,
  };
}

function structuralIssues(item, source) {
  const issues = [];
  const ranges = [
    ["temperature", "min_temp_f", "max_temp_f"],
    ["recommended_temperature", "recommended_min_temp_f", "recommended_max_temp_f"],
    ["tolerated_temperature", "tolerated_min_temp_f", "tolerated_max_temp_f"],
    ["pH", "min_ph", "max_ph"],
    ["GH", "min_gh_dgh", "max_gh_dgh"],
    ["KH", "min_kh_dkh", "max_kh_dkh"],
  ];

  for (const [label, minimumField, maximumField] of ranges) {
    const minimum = item[minimumField];
    const maximum = item[maximumField];
    if (minimum != null && maximum != null && minimum > maximum) {
      issues.push(
        issue(
          item.slug,
          `${minimumField}/${maximumField}`,
          "critical",
          "invalid_range",
          `${source} ${label} minimum is greater than its maximum.`,
          source === "local" ? [minimum, maximum] : undefined,
          source === "database" ? [minimum, maximum] : undefined,
        ),
      );
    }
  }

  if (
    item.recommended_min_temp_f != null &&
    item.recommended_max_temp_f != null &&
    item.tolerated_min_temp_f != null &&
    item.tolerated_max_temp_f != null &&
    (item.recommended_min_temp_f < item.tolerated_min_temp_f ||
      item.recommended_max_temp_f > item.tolerated_max_temp_f)
  ) {
    issues.push(
      issue(
        item.slug,
        "recommended_temperature",
        "high",
        "recommended_outside_tolerated",
        `${source} recommended temperature range falls outside the tolerated range.`,
      ),
    );
  }

  return issues;
}

async function main() {
  const localPayload = readJson("data/import/species.master.json");
  const localSpecies = localPayload.species || localPayload;
  const sourcePayload = readJson("data/import/species.sources.json");
  const sourceEntries = sourcePayload.species || {};
  const [speciesResult, aliasResult, sourceResult] = await Promise.all([
    supabase.from("species").select("*").order("slug"),
    supabase.from("species_aliases").select("species_id,alias"),
    supabase
      .from("species_source_references")
      .select("species_id,source_category,source_url"),
  ]);

  for (const [label, result] of [
    ["Species", speciesResult],
    ["Species alias", aliasResult],
    ["Species source", sourceResult],
  ]) {
    if (result.error) {
      throw new Error(`${label} database audit load failed: ${result.error.message}`);
    }
  }
  const databaseSpecies = speciesResult.data || [];
  const databaseAliases = aliasResult.data || [];
  const databaseSources = sourceResult.data || [];

  const localBySlug = new Map(localSpecies.map((item) => [item.slug, item]));
  const databaseBySlug = new Map(
    (databaseSpecies || []).map((item) => [item.slug, item]),
  );
  const localOnly = [...localBySlug.keys()].filter(
    (slug) => !databaseBySlug.has(slug),
  );
  const databaseOnly = [...databaseBySlug.keys()].filter(
    (slug) => !localBySlug.has(slug),
  );
  const ignoredLocalFields = new Set(["aliases"]);
  const comparisons = [];

  for (const [slug, local] of localBySlug) {
    const database = databaseBySlug.get(slug);
    if (!database) continue;

    for (const field of Object.keys(local)) {
      if (ignoredLocalFields.has(field) || !(field in database)) continue;
      if (!valuesMatch(local[field], database[field])) {
        comparisons.push(
          issue(
            slug,
            field,
            "high",
            "database_master_mismatch",
            "Database value differs from the canonical local master.",
            local[field],
            database[field],
          ),
        );
      }
    }
  }

  const slugById = new Map(databaseSpecies.map((item) => [item.id, item.slug]));
  const actualAliasesBySlug = new Map();
  for (const row of databaseAliases) {
    const slug = slugById.get(row.species_id);
    if (!slug) continue;
    const aliases = actualAliasesBySlug.get(slug) || [];
    aliases.push(row.alias);
    actualAliasesBySlug.set(slug, aliases);
  }
  const aliasIssues = localSpecies.flatMap((item) => {
    const expected = item.aliases || [];
    const actual = actualAliasesBySlug.get(item.slug) || [];
    return valuesMatch(expected, actual)
      ? []
      : [
          issue(
            item.slug,
            "aliases",
            "high",
            "database_alias_mismatch",
            "Database aliases differ from the canonical local master.",
            expected,
            actual,
          ),
        ];
  });
  const actualSourceKeys = new Set(
    databaseSources.flatMap((row) => {
      const slug = slugById.get(row.species_id);
      return slug
        ? [`${slug}\u0000${row.source_category}\u0000${row.source_url}`]
        : [];
    }),
  );
  const expectedSourceKeys = new Set(
    Object.entries(sourceEntries).flatMap(([slug, entry]) =>
      (entry.sources || []).map(
        (url) => `${slug}\u0000${sourceCategoryForUrl(url)}\u0000${url}`,
      ),
    ),
  );
  const sourceParityIssues = [
    ...[...expectedSourceKeys]
      .filter((key) => !actualSourceKeys.has(key))
      .map((key) =>
        issue(
          key.split("\u0000")[0],
          "sources",
          "high",
          "database_source_missing",
          "A canonical local source reference is missing from the database.",
        ),
      ),
    ...[...actualSourceKeys]
      .filter((key) => !expectedSourceKeys.has(key))
      .map((key) =>
        issue(
          key.split("\u0000")[0],
          "sources",
          "high",
          "database_source_stale",
          "The database contains a source reference absent from the canonical local file.",
        ),
      ),
  ];
  const sourceIssues = localSpecies.flatMap((item) => {
    const sources = sourceEntries[item.slug]?.sources;
    if (!Array.isArray(sources) || sources.length === 0) {
      return [
        issue(
          item.slug,
          "sources",
          "high",
          "missing_sources",
          "No husbandry source URL is recorded.",
        ),
      ];
    }
    return [];
  });
  const structural = [
    ...localSpecies.flatMap((item) => structuralIssues(item, "local")),
    ...(databaseSpecies || []).flatMap((item) =>
      structuralIssues(item, "database"),
    ),
  ];
  const mismatchesByField = comparisons.reduce((counts, item) => {
    counts[item.field] = (counts[item.field] || 0) + 1;
    return counts;
  }, {});
  const affectedSpecies = new Set(comparisons.map((item) => item.slug));
  const report = {
    generatedAt: new Date().toISOString(),
    readOnly: true,
    summary: {
      localSpecies: localSpecies.length,
      databaseSpecies: databaseSpecies?.length || 0,
      localOnly: localOnly.length,
      databaseOnly: databaseOnly.length,
      mismatchedFields: comparisons.length,
      speciesWithMismatches: affectedSpecies.size,
      structuralIssues: structural.length,
      missingSourceSpecies: sourceIssues.length,
      aliasMismatches: aliasIssues.length,
      sourceReferenceMismatches: sourceParityIssues.length,
      databaseSourceReferences: databaseSources.length,
    },
    inventory: { localOnly, databaseOnly },
    mismatchesByField,
    sourceIssues,
    aliasIssues,
    sourceParityIssues,
    structuralIssues: structural,
    mismatches: comparisons,
  };
  const outputDirectory = path.join(root, "reports", "species");
  const outputPath = path.join(outputDirectory, "database-audit.json");
  fs.mkdirSync(outputDirectory, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);

  console.log("GuideMyTank Species database audit");
  console.log(`Local Species: ${report.summary.localSpecies}`);
  console.log(`Database Species: ${report.summary.databaseSpecies}`);
  console.log(`Species with mismatches: ${report.summary.speciesWithMismatches}`);
  console.log(`Field mismatches: ${report.summary.mismatchedFields}`);
  console.log(`Structural issues: ${report.summary.structuralIssues}`);
  console.log(`Species missing sources: ${report.summary.missingSourceSpecies}`);
  console.log(`Alias mismatches: ${report.summary.aliasMismatches}`);
  console.log(
    `Source reference mismatches: ${report.summary.sourceReferenceMismatches}`,
  );
  console.log(
    `Database source references: ${report.summary.databaseSourceReferences}`,
  );
  console.log(`JSON report: ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

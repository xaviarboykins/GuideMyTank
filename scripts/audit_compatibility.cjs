/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const ts = require("typescript");
const { createClient } = require("@supabase/supabase-js");

const { loadLocalEnv } = require("./load_env_file.cjs");

const root = path.resolve(__dirname, "..");
const sourceDir = path.join(root, "src");
loadLocalEnv(root);

const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function resolveFilename(request, parent, isMain, options) {
  if (request.startsWith("@/")) {
    return originalResolveFilename.call(
      this,
      path.join(sourceDir, request.slice(2)),
      parent,
      isMain,
      options,
    );
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

require.extensions[".ts"] = function compileTypeScript(module, filename) {
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
      resolveJsonModule: true,
    },
    fileName: filename,
  });
  module._compile(output.outputText, filename);
};

const {
  auditCompatibilityPair,
  getCompatibilityAuditPairKey,
} = require("../src/lib/compatibility/audit.ts");

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

const compatibilityFields = [
  "max_size_inches",
  "tank_size_gal",
  "min_temp_f",
  "max_temp_f",
  "recommended_min_temp_f",
  "recommended_max_temp_f",
  "min_ph",
  "max_ph",
  "min_gh_dgh",
  "max_gh_dgh",
  "min_kh_dkh",
  "max_kh_dkh",
  "hardness_preference",
  "temperament",
  "aggression_level",
  "compatibility_tags",
  "schooling",
  "min_group_size",
  "preferred_group_size",
  "species_only_preferred",
  "fin_nipping_risk",
  "long_fin_vulnerable",
  "slow_moving",
  "delicate_species",
  "territory_zone",
  "territory_footprint",
  "breeding_aggression",
  "activity_level",
  "competitive_feeder",
  "flow_preference",
  "preferred_tank_style",
  "specialist_setup",
  "diet",
  "invert_safe",
  "mouth_gape_risk",
  "surface_predator",
  "armored_body",
  "deep_bodied",
  "slender_prey_body",
  "temperature_category",
  "ph_stability_required",
];

const severityRank = { critical: 0, high: 1, medium: 2, low: 3 };

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function canonicalOverrideKey(item) {
  return getCompatibilityAuditPairKey(item.species[0], item.species[1]);
}

function auditFieldCoverage(species) {
  return compatibilityFields.map((field) => {
    const populated = species.filter((item) => {
      const value = item[field];
      return (
        value !== null &&
        value !== undefined &&
        (!Array.isArray(value) || value.length > 0)
      );
    });
    const scalarValues = populated
      .map((item) => item[field])
      .filter(
        (value) =>
          typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean",
      );
    return {
      field,
      populated: populated.length,
      total: species.length,
      coveragePercent:
        species.length > 0
          ? Math.round((populated.length / species.length) * 1000) / 10
          : 0,
      normalizedValues:
        scalarValues.length > 0
          ? [...new Set(scalarValues)].sort().slice(0, 30)
          : undefined,
    };
  });
}

async function main() {
  const [
    speciesResult,
    rulesResult,
  ] = await Promise.all([
    supabase.from("species").select("*").order("slug"),
    supabase
      .from("compatibility_rules")
      .select(
        "species_a_id,species_b_id,compatibility,confidence,expert_validated,notes",
      )
      .eq("expert_validated", true),
  ]);
  const error = speciesResult.error || rulesResult.error;
  if (error) throw new Error(`Compatibility audit data load failed: ${error.message}`);

  const species = speciesResult.data || [];
  const speciesById = new Map(species.map((item) => [item.id, item]));
  const localPayload = readJson("data/import/species.master.json");
  const localSpecies = localPayload.species || localPayload;
  const localSlugs = new Set(localSpecies.map((item) => item.slug));
  const remoteSlugs = new Set(species.map((item) => item.slug));
  const regressionsPayload = readJson(
    "data/compatibility/known-regressions.json",
  );
  const regressions = new Map(
    regressionsPayload.pairs.map((item) => [
      getCompatibilityAuditPairKey(item.species[0], item.species[1]),
      { acceptable: item.acceptable, note: item.note },
    ]),
  );
  const fileOverridesPayload = readJson(
    "data/compatibility/expert-overrides.json",
  );
  const fileOverrides = new Map(
    fileOverridesPayload.overrides.map((item) => [
      canonicalOverrideKey(item),
      item,
    ]),
  );
  const databaseOverrides = new Map();
  for (const rule of rulesResult.data || []) {
    const speciesA = speciesById.get(rule.species_a_id);
    const speciesB = speciesById.get(rule.species_b_id);
    if (!speciesA || !speciesB) continue;
    databaseOverrides.set(
      getCompatibilityAuditPairKey(speciesA.slug, speciesB.slug),
      {
        compatibility: rule.compatibility,
        confidence: rule.confidence,
        expertValidated: true,
        notes: rule.notes,
      },
    );
  }

  const pairs = [];
  for (let index = 0; index < species.length; index += 1) {
    for (
      let otherIndex = index + 1;
      otherIndex < species.length;
      otherIndex += 1
    ) {
      const speciesA = species[index];
      const speciesB = species[otherIndex];
      const pairKey = getCompatibilityAuditPairKey(
        speciesA.slug,
        speciesB.slug,
      );
      pairs.push(
        auditCompatibilityPair(speciesA, speciesB, {
          override: databaseOverrides.get(pairKey),
          regression: regressions.get(pairKey),
        }),
      );
    }
  }

  pairs.sort((left, right) => {
    const leftRank = left.flags.length
      ? Math.min(...left.flags.map((item) => severityRank[item.severity]))
      : 99;
    const rightRank = right.flags.length
      ? Math.min(...right.flags.map((item) => severityRank[item.severity]))
      : 99;
    return (
      leftRank - rightRank ||
      right.flags.length - left.flags.length ||
      left.pairKey.localeCompare(right.pairKey)
    );
  });

  const classificationDistribution = pairs.reduce(
    (counts, item) => {
      const value = item.computed.compatibility || "unknown";
      counts[value] = (counts[value] || 0) + 1;
      return counts;
    },
    {},
  );
  const correctedPairs = pairs.filter(
    (item) =>
      item.computed.legacyScore !== item.computed.score ||
      item.computed.legacyCompatibility !== item.computed.compatibility,
  );
  const effectiveDistribution = pairs.reduce(
    (counts, item) => {
      const value = item.effective.compatibility || "unknown";
      counts[value] = (counts[value] || 0) + 1;
      return counts;
    },
    {},
  );
  const flagCounts = {};
  for (const pair of pairs) {
    for (const item of pair.flags) {
      flagCounts[item.code] = (flagCounts[item.code] || 0) + 1;
    }
  }
  const overrideParity = {
    fileOnly: [...fileOverrides.keys()].filter(
      (key) => !databaseOverrides.has(key),
    ),
    databaseOnly: [...databaseOverrides.keys()].filter(
      (key) => !fileOverrides.has(key),
    ),
    classificationMismatches: [...fileOverrides.entries()].flatMap(
      ([key, value]) => {
        const remote = databaseOverrides.get(key);
        return remote && remote.compatibility !== value.compatibility
          ? [
              {
                pairKey: key,
                file: value.compatibility,
                database: remote.compatibility,
              },
            ]
          : [];
      },
    ),
  };
  const flaggedPairs = pairs.filter((item) => item.flags.length > 0);
  const knownRegressionResults = [...regressions.keys()].map((pairKey) => {
    const pair = pairs.find((item) => item.pairKey === pairKey);
    return pair
      ? {
          pairKey,
          computed: pair.computed.compatibility,
          effective: pair.effective.compatibility,
          score: pair.computed.score,
          passed: !pair.flags.some(
            (item) => item.code === "known_regression_failed",
          ),
          flags: pair.flags,
        }
      : { pairKey, missing: true };
  });
  const report = {
    generatedAt: new Date().toISOString(),
    engineVersion: "phase-11c-hard-constraints",
    summary: {
      databaseSpecies: species.length,
      localSpecies: localSpecies.length,
      canonicalPairs: pairs.length,
      databaseOverrides: databaseOverrides.size,
      fileOverrides: fileOverrides.size,
      flaggedPairs: flaggedPairs.length,
      correctedPairs: correctedPairs.length,
      classificationDistribution,
      effectiveDistribution,
      flagCounts,
    },
    corrections: correctedPairs.map((item) => ({
      pairKey: item.pairKey,
      legacy: {
        score: item.computed.legacyScore,
        compatibility: item.computed.legacyCompatibility,
      },
      corrected: {
        score: item.computed.score,
        compatibility: item.computed.compatibility,
      },
      hardFindings: item.computed.findings.filter(
        (finding) => finding.severity === "error",
      ),
    })),
    consistency: {
      localOnlySpecies: [...localSlugs].filter((slug) => !remoteSlugs.has(slug)),
      databaseOnlySpecies: [...remoteSlugs].filter(
        (slug) => !localSlugs.has(slug),
      ),
      dropdownSource: {
        source: "getAllSpecies() database query",
        expectedCount: species.length,
        filteringDetected: false,
      },
      canonicalRouteCount: (species.length * (species.length - 1)) / 2,
      overrideParity,
    },
    confidenceMethod: {
      code: "structured_data_completeness",
      description:
        "Computed confidence measures completeness of core and contextual structured species data; it is independent from compatibility strength.",
    },
    fieldCoverage: {
      database: auditFieldCoverage(species),
      localMaster: auditFieldCoverage(localSpecies),
    },
    knownRegressions: knownRegressionResults,
    flaggedPairs,
    pairs,
  };

  const outputDirectory = path.join(root, "reports", "compatibility");
  const outputPath = path.join(outputDirectory, "audit.json");
  fs.mkdirSync(outputDirectory, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);

  console.log("GuideMyTank compatibility audit");
  console.log(`Database species: ${species.length}`);
  console.log(`Canonical pairs: ${pairs.length}`);
  console.log(`Flagged pairs: ${flaggedPairs.length}`);
  console.log(`Corrected by hard constraints: ${correctedPairs.length}`);
  console.log(
    `Computed distribution: ${JSON.stringify(classificationDistribution)}`,
  );
  console.log(`Flags: ${JSON.stringify(flagCounts)}`);
  console.log(`Known regressions: ${JSON.stringify(knownRegressionResults)}`);
  console.log(`JSON report: ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

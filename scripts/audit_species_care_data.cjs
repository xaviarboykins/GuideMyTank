/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const speciesPath = path.join(rootDir, "data", "import", "species.master.json");
const batchArgIndex = process.argv.indexOf("--batch");
const selectedBatch =
  batchArgIndex >= 0 ? process.argv[batchArgIndex + 1]?.trim() : "";
const reportFilename = selectedBatch
  ? `species-care-data-audit-${selectedBatch}.md`
  : "species-care-data-audit.md";
const reportPath = path.join(rootDir, "docs", "data-audits", reportFilename);

const payload = JSON.parse(fs.readFileSync(speciesPath, "utf8"));
const allSpecies = payload.species || payload;

function getBatch(item) {
  if (item.family === "Cichlidae") return "cichlids";
  if (item.family === "Osphronemidae") return "bettas-gouramis";
  if (item.family === "Cyprinidae") return "barbs-danios-rasboras";
  if (item.family === "Characidae") return "tetras";
  if (["Atyidae", "Neritidae", "Ampullariidae", "Thiaridae"].includes(item.family)) {
    return "invertebrates";
  }
  if (item.preferred_tank_style === "goldfish") return "goldfish";
  if (item.max_size_inches != null && item.max_size_inches <= 2) return "nano-fish";

  return "general-community";
}

const knownBatches = Array.from(new Set(allSpecies.map(getBatch))).sort();
const species = selectedBatch
  ? allSpecies.filter((item) => getBatch(item) === selectedBatch)
  : allSpecies;

if (selectedBatch && !knownBatches.includes(selectedBatch)) {
  console.error(`Unknown batch '${selectedBatch}'. Known batches: ${knownBatches.join(", ")}`);
  process.exit(1);
}

const temperamentAggressionBands = {
  Peaceful: { min: 1, max: 3 },
  "Semi-Aggressive": { min: 3, max: 6 },
  Aggressive: { min: 6, max: 10 },
};

function hasTag(item, tag) {
  return Array.isArray(item.compatibility_tags) && item.compatibility_tags.includes(tag);
}

function hasCareWarnings(item) {
  return Array.isArray(item.care_warnings) && item.care_warnings.length > 0;
}

function hasHighRiskCareProfile(item) {
  return (
    item.temperament === "Aggressive" ||
    item.specialist_setup === true ||
    item.species_only_preferred === true ||
    item.mouth_gape_risk === true ||
    item.surface_predator === true ||
    item.fin_nipping_risk === true ||
    item.preferred_tank_style === "goldfish" ||
    item.preferred_tank_style === "predator"
  );
}

function issue(item, severity, field, message) {
  return {
    slug: item.slug,
    commonName: item.common_name,
    severity,
    field,
    message,
  };
}

function auditSpecies(item) {
  const issues = [];
  const tempSpan =
    item.min_temp_f != null && item.max_temp_f != null
      ? item.max_temp_f - item.min_temp_f
      : null;
  const phSpan =
    item.min_ph != null && item.max_ph != null ? item.max_ph - item.min_ph : null;
  const band = item.temperament
    ? temperamentAggressionBands[item.temperament]
    : null;

  if (!item.data_confidence) {
    issues.push(issue(item, "medium", "data_confidence", "Missing data confidence."));
  }

  if (!item.temp_source_notes || !item.temp_source_notes.trim()) {
    issues.push(
      issue(item, "low", "temp_source_notes", "Missing temperature source note."),
    );
  }

  if (hasHighRiskCareProfile(item) && !hasCareWarnings(item)) {
    issues.push(
      issue(
        item,
        "medium",
        "care_warnings",
        "High-risk or specialist species should have at least one profile care warning.",
      ),
    );
  }

  if (item.min_temp_f == null || item.max_temp_f == null) {
    issues.push(issue(item, "high", "temperature", "Missing temperature range."));
  } else {
    if (item.min_temp_f < 50 || item.max_temp_f > 90) {
      issues.push(
        issue(
          item,
          "high",
          "temperature",
          `Temperature range ${item.min_temp_f}-${item.max_temp_f} F is outside the normal freshwater profile range.`,
        ),
      );
    }

    if (tempSpan != null && tempSpan > 16) {
      issues.push(
        issue(
          item,
          "medium",
          "temperature",
          `Temperature range ${item.min_temp_f}-${item.max_temp_f} F is very broad and may be too permissive.`,
        ),
      );
    }

    if (
      item.temperature_category === "cool" &&
      item.min_temp_f >= 72 &&
      item.max_temp_f >= 80
    ) {
      issues.push(
        issue(
          item,
          "medium",
          "temperature_category",
          "Marked cool-water but the range is mostly tropical.",
        ),
      );
    }

    if (item.temperature_category === "warm" && item.max_temp_f <= 78) {
      issues.push(
        issue(
          item,
          "medium",
          "temperature_category",
          "Marked warm-water but the range tops out in a cooler/tropical range.",
        ),
      );
    }
  }

  if (item.min_ph == null || item.max_ph == null) {
    issues.push(issue(item, "high", "pH", "Missing pH range."));
  } else {
    if (item.min_ph < 4 || item.max_ph > 9) {
      issues.push(
        issue(
          item,
          "medium",
          "pH",
          `pH range ${item.min_ph}-${item.max_ph} is unusually extreme for a general care profile.`,
        ),
      );
    }

    if (phSpan != null && phSpan > 2) {
      issues.push(
        issue(
          item,
          "medium",
          "pH",
          `pH range ${item.min_ph}-${item.max_ph} is very broad and may hide a true preference.`,
        ),
      );
    }

    if (hasTag(item, "softwater") && item.min_ph >= 7) {
      issues.push(
        issue(
          item,
          "medium",
          "pH/tags",
          "Tagged softwater but minimum pH is neutral or alkaline.",
        ),
      );
    }

    if (hasTag(item, "hardwater") && item.max_ph <= 7.5) {
      issues.push(
        issue(
          item,
          "medium",
          "pH/tags",
          "Tagged hardwater but maximum pH is not clearly alkaline.",
        ),
      );
    }
  }

  if (!item.temperament) {
    issues.push(issue(item, "high", "temperament", "Missing temperament."));
  }

  if (band && item.aggression_level != null) {
    if (item.aggression_level < band.min || item.aggression_level > band.max) {
      issues.push(
        issue(
          item,
          "medium",
          "temperament/aggression_level",
          `${item.temperament} temperament with aggression ${item.aggression_level}/10 falls outside the expected ${band.min}-${band.max} band.`,
        ),
      );
    }
  }

  if (
    item.temperament === "Peaceful" &&
    (hasTag(item, "aggressive") || hasTag(item, "semi_aggressive"))
  ) {
    issues.push(
      issue(
        item,
        "medium",
        "temperament/tags",
        "Peaceful temperament conflicts with aggressive/semi-aggressive tags.",
      ),
    );
  }

  if (
    item.temperament === "Aggressive" &&
    (hasTag(item, "peaceful") || item.aggression_level < 6)
  ) {
    issues.push(
      issue(
        item,
        "medium",
        "temperament/tags",
        "Aggressive temperament conflicts with peaceful tags or low aggression.",
      ),
    );
  }

  if (
    item.temperament === "Semi-Aggressive" &&
    item.aggression_level <= 3 &&
    !hasTag(item, "territorial") &&
    !item.fin_nipping_risk
  ) {
    issues.push(
      issue(
        item,
        "low",
        "temperament/aggression_level",
        "Semi-aggressive label may be too strong without territorial, fin-nipping, or higher aggression signals.",
      ),
    );
  }

  return issues;
}

const issues = species.flatMap(auditSpecies);
const severitySort = { high: 0, medium: 1, low: 2 };
issues.sort((a, b) => {
  return (
    severitySort[a.severity] - severitySort[b.severity] ||
    a.slug.localeCompare(b.slug) ||
    a.field.localeCompare(b.field)
  );
});

const grouped = {
  high: issues.filter((item) => item.severity === "high"),
  medium: issues.filter((item) => item.severity === "medium"),
  low: issues.filter((item) => item.severity === "low"),
};

function tableRows(rows) {
  if (rows.length === 0) {
    return "No issues flagged.\n";
  }

  return [
    "| Species | Field | Issue |",
    "| --- | --- | --- |",
    ...rows.map(
      (item) =>
        `| ${item.commonName} (\`${item.slug}\`) | ${item.field} | ${item.message} |`,
    ),
    "",
  ].join("\n");
}

const report = [
  "# Species Care Data Audit",
  "",
  "Generated by `npm run audit:species-data`.",
  "",
  "This audit flags suspicious values in the source species dataset. It does not prove a row is wrong; it identifies records that should be checked against trusted care references before import.",
  "",
  "## Scope",
  "",
  "- Temperature ranges",
  "- pH ranges",
  "- Temperature category consistency",
  "- pH/tag consistency",
  "- Temperament and aggression-level consistency",
  "- Temperament/tag consistency",
  "- Data confidence and temperature source notes",
  "- Care warnings for high-risk or specialist species",
  "",
  "## Summary",
  "",
  `- Species audited: ${species.length}`,
  selectedBatch ? `- Batch: ${selectedBatch}` : `- Batches: ${knownBatches.join(", ")}`,
  `- High-priority flags: ${grouped.high.length}`,
  `- Medium-priority flags: ${grouped.medium.length}`,
  `- Low-priority flags: ${grouped.low.length}`,
  "",
  "## High Priority",
  "",
  tableRows(grouped.high),
  "## Medium Priority",
  "",
  tableRows(grouped.medium),
  "## Low Priority",
  "",
  tableRows(grouped.low),
  "## Audit Notes",
  "",
  "- Broad ranges are not always wrong, but they can make compatibility look safer than it is.",
  "- Temperament should describe normal adult community behavior, not just breeding behavior.",
  "- `aggression_level` should make the temperament label more precise: peaceful is usually 1-3, semi-aggressive 3-6, aggressive 6-10.",
  "- When sources disagree, prefer conservative values and use special rules for known exceptions.",
  "- High-risk species should have explicit care warnings so users see the issue before running a compatibility comparison.",
  "",
].join("\n");

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, report);

console.log(`Audited ${species.length} species.`);
if (selectedBatch) console.log(`Batch: ${selectedBatch}`);
console.log(`High-priority flags: ${grouped.high.length}`);
console.log(`Medium-priority flags: ${grouped.medium.length}`);
console.log(`Low-priority flags: ${grouped.low.length}`);
console.log(path.relative(rootDir, reportPath));

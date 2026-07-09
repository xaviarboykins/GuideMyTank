/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const speciesPath = path.join(rootDir, "data", "import", "species.master.json");
const sourcesPath = path.join(rootDir, "data", "import", "species.sources.json");

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function sourceCategoryForUrl(url) {
  if (url.includes("wikipedia.org/wiki/")) return "taxonomy";
  return "care";
}

function validateSpeciesSources() {
  const speciesPayload = loadJson(speciesPath);
  const sourcesPayload = loadJson(sourcesPath);
  const species = speciesPayload.species || speciesPayload;
  const speciesSlugs = new Set(species.map((item) => item.slug));
  const sourceEntries = sourcesPayload.species || {};
  const errors = [];

  for (const slug of Object.keys(sourceEntries)) {
    if (!speciesSlugs.has(slug)) {
      errors.push(`Unknown species slug '${slug}' in species.sources.json.`);
    }

    const sources = sourceEntries[slug].sources;
    if (!Array.isArray(sources)) {
      errors.push(`${slug}: sources must be an array.`);
      continue;
    }

    const seenUrls = new Set();
    for (const sourceUrl of sources) {
      if (typeof sourceUrl !== "string" || !/^https?:\/\//.test(sourceUrl)) {
        errors.push(`${slug}: invalid source URL '${sourceUrl}'.`);
        continue;
      }

      const key = `${sourceCategoryForUrl(sourceUrl)}::${sourceUrl}`;
      if (seenUrls.has(key)) {
        errors.push(`${slug}: duplicate source '${sourceUrl}'.`);
      }
      seenUrls.add(key);
    }
  }

  const missingSourceSlugs = [...speciesSlugs].filter(
    (slug) => !sourceEntries[slug],
  );

  if (missingSourceSlugs.length > 0) {
    errors.push(
      `Missing source entries for species: ${missingSourceSlugs.join(", ")}.`,
    );
  }

  return errors;
}

const errors = validateSpeciesSources();

if (errors.length > 0) {
  console.error("Species source validation failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("Species source validation passed.");

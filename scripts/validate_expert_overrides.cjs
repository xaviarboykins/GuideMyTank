/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const speciesPath = path.join(rootDir, "data", "import", "species.master.json");
const overridesPath = path.join(rootDir, "data", "compatibility", "expert-overrides.json");

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function canonicalPair(species) {
  return [...species].sort().join("::");
}

function validateExpertOverrides() {
  const speciesPayload = loadJson(speciesPath);
  const overridesPayload = loadJson(overridesPath);
  const species = speciesPayload.species || speciesPayload;
  const speciesSlugs = new Set(species.map((item) => item.slug));
  const overrides = overridesPayload.overrides || [];
  const seenPairs = new Set();
  const errors = [];

  if (!Array.isArray(overrides)) {
    errors.push("expert-overrides.json must contain an overrides array.");
    return errors;
  }

  for (const [index, override] of overrides.entries()) {
    const label = `override #${index + 1}`;

    if (!Array.isArray(override.species) || override.species.length !== 2) {
      errors.push(`${label}: species must contain exactly two slugs.`);
      continue;
    }

    const [speciesA, speciesB] = override.species;

    if (speciesA === speciesB) {
      errors.push(`${label}: species pair must contain two different slugs.`);
    }

    for (const slug of override.species) {
      if (!speciesSlugs.has(slug)) {
        errors.push(`${label}: unknown species slug '${slug}'.`);
      }
    }

    const pairKey = canonicalPair(override.species);
    if (seenPairs.has(pairKey)) {
      errors.push(`${label}: duplicate unordered species pair '${pairKey}'.`);
    }
    seenPairs.add(pairKey);

    if (!["compatible", "caution", "incompatible"].includes(override.compatibility)) {
      errors.push(`${label}: compatibility must be compatible, caution, or incompatible.`);
    }

    if (
      typeof override.confidence !== "number" ||
      override.confidence < 0 ||
      override.confidence > 1
    ) {
      errors.push(`${label}: confidence must be a number from 0 to 1.`);
    }

    if (typeof override.expert_validated !== "boolean") {
      errors.push(`${label}: expert_validated must be a boolean.`);
    }

    if (typeof override.notes !== "string" || !override.notes.trim()) {
      errors.push(`${label}: notes are required.`);
    }
  }

  return errors;
}

const errors = validateExpertOverrides();

if (errors.length > 0) {
  console.error("Expert override validation failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("Expert override validation passed.");

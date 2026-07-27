import { normalizeContentSlug } from "../../content/slug";

function requireEntitySlug(value: string, label: string) {
  const normalized = normalizeContentSlug(value);

  if (!normalized) {
    throw new Error(`${label} must contain a valid identifier.`);
  }

  return normalized;
}

export function createComparisonGenerationKey(
  speciesA: string,
  speciesB: string,
) {
  const pair = [
    requireEntitySlug(speciesA, "Species A"),
    requireEntitySlug(speciesB, "Species B"),
  ].sort();

  if (pair[0] === pair[1]) {
    throw new Error("A comparison Guide requires two different species.");
  }

  return `comparison:${pair.join("-")}`;
}

export function createTankMateGenerationKey(
  species: string,
  variant: "tank-mates" | "avoid-with" = "tank-mates",
) {
  return `${variant}:${requireEntitySlug(species, "Species")}`;
}

export function createTankSizeGenerationKey(
  gallons: number,
  variation?: string,
) {
  if (!Number.isInteger(gallons) || gallons <= 0) {
    throw new Error("Tank size must be a positive whole number of gallons.");
  }

  const suffix = variation
    ? `-${requireEntitySlug(variation, "Tank-size variation")}`
    : "";

  return `tank-size:${gallons}-gallon${suffix}`;
}

export function createExtensibleGenerationKey(
  namespace: string,
  identityParts: string[],
) {
  const normalizedNamespace = requireEntitySlug(namespace, "Guide namespace");
  const normalizedParts = identityParts.map((part, index) =>
    requireEntitySlug(part, `Identity part ${index + 1}`),
  );

  if (!normalizedParts.length) {
    throw new Error("A generation key requires at least one identity part.");
  }

  return `${normalizedNamespace}:${normalizedParts.join("-")}`;
}

export function normalizeSearchIntent(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

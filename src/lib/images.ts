import speciesImageAssets from "../../data/images/species-image-assets.json";

type SpeciesImageAsset = {
  imageUrl: string;
  alt: string;
  status: string;
};

const AVAILABLE_SPECIES_IMAGES = new Set(
  Object.entries(speciesImageAssets as Record<string, SpeciesImageAsset>)
    .filter(([, asset]) => asset.status === "ready")
    .map(([slug]) => slug),
);

export const SPECIES_PLACEHOLDER_IMAGE = "/species/placeholder.webp";

export function normalizeSpeciesSlug(slug: string) {
  return slug
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/(^-|-$)/g, "");
}

export function getSpeciesImage(slug: string) {
  const normalizedSlug = normalizeSpeciesSlug(slug);
  return AVAILABLE_SPECIES_IMAGES.has(normalizedSlug)
    ? `/species/${normalizedSlug}.webp`
    : SPECIES_PLACEHOLDER_IMAGE;
}

export function hasSpeciesImage(slug: string) {
  return AVAILABLE_SPECIES_IMAGES.has(normalizeSpeciesSlug(slug));
}

export function resolveSpeciesImage(slug: string, legacySource?: string | null) {
  if (hasSpeciesImage(slug)) return getSpeciesImage(slug);
  return legacySource || SPECIES_PLACEHOLDER_IMAGE;
}

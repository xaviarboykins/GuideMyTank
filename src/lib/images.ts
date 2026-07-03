const AVAILABLE_SPECIES_IMAGES = [
  "angelfish",
  "betta-splendens",
  "corydoras-catfish",
  "guppy",
  "honey-gourami",
];

const SPECIES_PLACEHOLDER_IMAGE = "/species/placeholder.webp";

export function getSpeciesImage(slug: string) {
  return AVAILABLE_SPECIES_IMAGES.includes(slug)
    ? `/species/${slug}.webp`
    : SPECIES_PLACEHOLDER_IMAGE;
}

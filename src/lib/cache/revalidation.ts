import { revalidatePath } from "next/cache";

import { getCompatibilityPath } from "../compatibility/urls";
import type { ProductCategory } from "../products/types";

export type EditorialFamily = "article" | "care-guide" | "guide";

export function getEditorialRevalidationPaths(
  family: EditorialFamily,
  slugs: readonly (string | null | undefined)[],
) {
  const detailPrefix =
    family === "care-guide"
      ? "/care-guides"
      : family === "guide"
        ? "/learning-center/guides"
        : "/learning-center";
  const paths = new Set(["/", "/learning-center"]);

  if (family === "care-guide") {
    paths.add("/care-guides");
    paths.add("/care-guides/sitemap.xml");
  } else {
    paths.add("/learning-center/articles");
    paths.add("/learning-center/guides");
    paths.add("/learning-center/sitemap.xml");
  }

  for (const slug of slugs) {
    if (slug) paths.add(`${detailPrefix}/${slug}`);
  }

  return [...paths];
}

export function getSpeciesRevalidationPaths(
  slug: string,
  relatedSpeciesSlugs: readonly string[] = [],
  dependentGuideSlugs: readonly string[] = [],
) {
  const paths = new Set([
    "/species",
    `/species/${slug}`,
    "/piscidex",
    "/compatibility",
    "/species/sitemap.xml",
  ]);

  for (const relatedSlug of relatedSpeciesSlugs) {
    if (relatedSlug !== slug) {
      paths.add(getCompatibilityPath(slug, relatedSlug));
    }
  }
  for (const guideSlug of dependentGuideSlugs) {
    paths.add(`/learning-center/guides/${guideSlug}`);
  }

  return [...paths];
}

export function getCompatibilityRevalidationPaths(
  speciesA: string,
  speciesB: string,
) {
  return [
    getCompatibilityPath(speciesA, speciesB),
    `/species/${speciesA}`,
    `/species/${speciesB}`,
    "/compatibility",
  ];
}

export function getProductRevalidationPaths(input: {
  slug?: string | null;
  category?: ProductCategory | null;
  publicInventoryChanged?: boolean;
}) {
  const paths = new Set(["/products"]);
  if (input.slug) paths.add(`/products/${input.slug}`);
  if (input.category) {
    paths.add(`/aquarium-builder/products/${input.category}`);
  }
  if (input.publicInventoryChanged) paths.add("/sitemap.xml");
  return [...paths];
}

function revalidatePaths(paths: readonly string[]) {
  for (const path of paths) revalidatePath(path);
}

export function revalidateEditorialContent(
  family: EditorialFamily,
  slugs: readonly (string | null | undefined)[],
) {
  revalidatePaths(getEditorialRevalidationPaths(family, slugs));
}

export function revalidateSpeciesContent(
  slug: string,
  relatedSpeciesSlugs: readonly string[] = [],
  dependentGuideSlugs: readonly string[] = [],
) {
  revalidatePaths(
    getSpeciesRevalidationPaths(slug, relatedSpeciesSlugs, dependentGuideSlugs),
  );
}

export function revalidateCompatibilityPair(
  speciesA: string,
  speciesB: string,
) {
  revalidatePaths(getCompatibilityRevalidationPaths(speciesA, speciesB));
}

export function revalidateProductContent(
  input: Parameters<typeof getProductRevalidationPaths>[0],
) {
  revalidatePaths(getProductRevalidationPaths(input));
}

import { getAquariumBuilderProductCategory } from "../../aquarium-builder/product-categories";
import { getCompatibilityPath } from "../../compatibility/urls";

import type { InternalLinkRouteTarget } from "./types";

const ROUTE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const INTERNAL_ORIGIN = "https://internal.guidemytank.invalid";

function isRouteSlug(value: string) {
  return ROUTE_SLUG_PATTERN.test(value);
}

export function normalizeInternalPath(value: string): string | null {
  const trimmedValue = value.trim();

  if (!trimmedValue.startsWith("/") || trimmedValue.startsWith("//")) {
    return null;
  }

  try {
    const url = new URL(trimmedValue, INTERNAL_ORIGIN);

    if (url.origin !== INTERNAL_ORIGIN) {
      return null;
    }

    const pathname =
      url.pathname.length > 1 ? url.pathname.replace(/\/+$/, "") : "/";

    return pathname;
  } catch {
    return null;
  }
}

export function resolveInternalLinkPath(
  target: InternalLinkRouteTarget,
): string | null {
  switch (target.entityType) {
    case "species":
      return isRouteSlug(target.slug) ? `/species/${target.slug}` : null;
    case "care-guide":
      return isRouteSlug(target.slug) ? `/care-guides/${target.slug}` : null;
    case "compatibility-report":
      if (
        !isRouteSlug(target.speciesASlug) ||
        !isRouteSlug(target.speciesBSlug) ||
        target.speciesASlug === target.speciesBSlug
      ) {
        return null;
      }

      return getCompatibilityPath(
        target.speciesASlug,
        target.speciesBSlug,
      );
    case "article":
      return isRouteSlug(target.slug)
        ? `/learning-center/${target.slug}`
        : null;
    case "guide":
      return isRouteSlug(target.slug)
        ? `/learning-center/guides/${target.slug}`
        : null;
    case "builder":
      return "/aquarium-builder";
    case "product-category":
      return getAquariumBuilderProductCategory(target.category)
        ? `/aquarium-builder/products/${target.category}`
        : null;
    case "topic-cluster":
      return normalizeInternalPath(target.hubHref);
  }
}

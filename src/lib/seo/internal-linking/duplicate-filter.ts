import {
  DEFAULT_INTERNAL_LINK_LIMIT,
  MAX_INTERNAL_LINK_LIMIT,
} from "./constants";
import { normalizeInternalPath } from "./route-resolver";
import type {
  InternalLinkFilterOptions,
  InternalLinkItem,
} from "./types";

function getLimit(limit: number | undefined) {
  if (limit === undefined) {
    return DEFAULT_INTERNAL_LINK_LIMIT;
  }

  if (!Number.isFinite(limit) || limit <= 0) {
    return 0;
  }

  return Math.min(Math.floor(limit), MAX_INTERNAL_LINK_LIMIT);
}

function compareItems(a: InternalLinkItem, b: InternalLinkItem) {
  const scoreDifference = (b.score ?? 0) - (a.score ?? 0);

  if (scoreDifference !== 0) {
    return scoreDifference;
  }

  const titleDifference = a.title.localeCompare(b.title);

  return titleDifference !== 0 ? titleDifference : a.href.localeCompare(b.href);
}

export function filterInternalLinkItems(
  items: InternalLinkItem[],
  options: InternalLinkFilterOptions = {},
): InternalLinkItem[] {
  const limit = getLimit(options.limit);

  if (limit === 0) {
    return [];
  }

  const sourcePath = options.source
    ? normalizeInternalPath(options.source.href)
    : null;
  const itemsByPath = new Map<string, InternalLinkItem>();

  for (const item of items) {
    const canonicalPath = normalizeInternalPath(item.href);

    if (!canonicalPath || canonicalPath === sourcePath) {
      continue;
    }

    const canonicalItem = { ...item, href: canonicalPath };
    const existingItem = itemsByPath.get(canonicalPath);

    if (!existingItem || compareItems(canonicalItem, existingItem) < 0) {
      itemsByPath.set(canonicalPath, canonicalItem);
    }
  }

  return [...itemsByPath.values()].sort(compareItems).slice(0, limit);
}

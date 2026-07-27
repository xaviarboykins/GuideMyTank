import { normalizeInternalPath } from "./internal-linking/route-resolver";
import { getBreadcrumbId } from "./identities";
import { buildBreadcrumbList } from "./schema/builders";
import { getSiteUrl } from "./site-url";

export type BreadcrumbItem = {
  name: string;
  path: string;
};

export function createBreadcrumbs(
  items: readonly BreadcrumbItem[],
): BreadcrumbItem[] | null {
  if (items.length === 0) return null;

  const breadcrumbs = items.map((item) => {
    const name = item.name.trim();
    const path = normalizeInternalPath(item.path);
    return name && path ? { name, path } : null;
  });

  if (breadcrumbs.some((item) => item === null)) return null;
  return breadcrumbs as BreadcrumbItem[];
}

export function buildBreadcrumbEntity(
  pagePath: string,
  items: readonly BreadcrumbItem[],
) {
  const breadcrumbs = createBreadcrumbs(items);
  if (!breadcrumbs) return null;

  return buildBreadcrumbList({
    id: getBreadcrumbId(pagePath),
    items: breadcrumbs.map((item) => ({
      name: item.name,
      url: getSiteUrl(item.path),
    })),
  });
}

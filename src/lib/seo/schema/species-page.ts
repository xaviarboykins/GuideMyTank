import type { BreadcrumbItem } from "../breadcrumbs";
import { buildBreadcrumbEntity } from "../breadcrumbs";
import {
  getSpeciesEntityId,
  getWebPageId,
} from "../identities";
import { getSiteUrl } from "../site-url";

import {
  buildOrganization,
  buildThing,
  buildWebPage,
  buildWebSite,
} from "./builders";

export function buildSpeciesPageEntities(input: {
  slug: string;
  name: string | null | undefined;
  scientificName?: string | null;
  description: string | null | undefined;
  dateModified?: string | null;
  breadcrumbs: readonly BreadcrumbItem[];
}) {
  const path = `/species/${input.slug}`;
  const canonical = getSiteUrl(path);
  const speciesId = getSpeciesEntityId(input.slug);

  return [
    buildOrganization(),
    buildWebSite(),
    buildThing({
      id: speciesId,
      name: input.name,
      alternateName: input.scientificName,
      description: input.description,
      url: canonical,
    }),
    buildWebPage({
      id: getWebPageId(path),
      name: input.name,
      description: input.description,
      url: canonical,
      aboutIds: [speciesId],
      dateModified: input.dateModified,
    }),
    buildBreadcrumbEntity(path, input.breadcrumbs),
  ];
}

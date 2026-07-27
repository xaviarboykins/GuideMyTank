import type { BreadcrumbItem } from "../breadcrumbs";
import { buildBreadcrumbEntity } from "../breadcrumbs";
import {
  getSpeciesEntityId,
  getWebPageId,
} from "../identities";
import { getCompatibilityPath } from "../../compatibility/urls";
import { getSiteUrl } from "../site-url";

import {
  buildOrganization,
  buildThing,
  buildWebPage,
  buildWebSite,
} from "./builders";

type CompatibilitySubject = {
  slug: string;
  name: string | null | undefined;
};

export function buildCompatibilityPageEntities(input: {
  speciesA: CompatibilitySubject;
  speciesB: CompatibilitySubject;
  name: string;
  description: string;
  breadcrumbs: readonly BreadcrumbItem[];
}) {
  const [speciesA, speciesB] = [input.speciesA, input.speciesB].sort(
    (left, right) => left.slug.localeCompare(right.slug),
  );
  const path = getCompatibilityPath(
    speciesA.slug,
    speciesB.slug,
  );
  const speciesAId = getSpeciesEntityId(speciesA.slug);
  const speciesBId = getSpeciesEntityId(speciesB.slug);

  return [
    buildOrganization(),
    buildWebSite(),
    buildThing({
      id: speciesAId,
      name: speciesA.name,
      url: getSiteUrl(`/species/${speciesA.slug}`),
    }),
    buildThing({
      id: speciesBId,
      name: speciesB.name,
      url: getSiteUrl(`/species/${speciesB.slug}`),
    }),
    buildWebPage({
      id: getWebPageId(path),
      name: input.name,
      description: input.description,
      url: getSiteUrl(path),
      aboutIds: [speciesAId, speciesBId],
    }),
    buildBreadcrumbEntity(path, input.breadcrumbs),
  ];
}

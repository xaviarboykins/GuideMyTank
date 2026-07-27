import type { BreadcrumbItem } from "../breadcrumbs";
import { buildBreadcrumbEntity } from "../breadcrumbs";
import {
  getItemListId,
  getWebPageId,
} from "../identities";
import { getSiteUrl } from "../site-url";

import {
  buildCollectionPage,
  buildItemList,
  buildOrganization,
  buildWebSite,
} from "./builders";

export type VisibleCollectionItem = {
  name: string | null | undefined;
  path: string;
};

export function buildCollectionPageEntities(input: {
  path: string;
  name: string;
  description: string;
  breadcrumbs: readonly BreadcrumbItem[];
  visibleItems?: readonly VisibleCollectionItem[] | null;
}) {
  const itemList = input.visibleItems?.length
    ? buildItemList({
        id: getItemListId(input.path),
        items: input.visibleItems.map((item) => ({
          name: item.name,
          url: getSiteUrl(item.path),
        })),
      })
    : null;

  return [
    buildOrganization(),
    buildWebSite(),
    buildCollectionPage({
      id: getWebPageId(input.path),
      name: input.name,
      description: input.description,
      url: getSiteUrl(input.path),
      itemListId: itemList?.["@id"],
    }),
    buildBreadcrumbEntity(input.path, input.breadcrumbs),
    itemList,
  ];
}

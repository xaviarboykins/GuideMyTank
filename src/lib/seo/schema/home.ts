import { getWebPageId } from "../identities";
import { getSiteUrl } from "../site-url";

import {
  buildOrganization,
  buildWebPage,
  buildWebSite,
} from "./builders";

export function buildHomePageEntities(input: {
  name: string;
  description: string;
}) {
  return [
    buildOrganization(),
    buildWebSite(),
    buildWebPage({
      id: getWebPageId(),
      name: input.name,
      description: input.description,
      url: getSiteUrl(),
    }),
  ];
}

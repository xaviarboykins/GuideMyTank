import type { BreadcrumbItem } from "../breadcrumbs";
import { buildBreadcrumbEntity } from "../breadcrumbs";
import {
  getArticleId,
  getFaqId,
  getWebPageId,
} from "../identities";
import { getSiteUrl } from "../site-url";

import {
  buildArticle,
  buildFaqPage,
  buildOrganization,
  buildWebPage,
  buildWebSite,
} from "./builders";

export type VisibleFaqItem = {
  question: string | null | undefined;
  answer: string | null | undefined;
};

export function buildArticlePageEntities(input: {
  path: string;
  headline: string | null | undefined;
  description: string | null | undefined;
  datePublished?: string | null;
  dateModified?: string | null;
  articleSection?: string | null;
  keywords?: readonly string[] | null;
  breadcrumbs: readonly BreadcrumbItem[];
  visibleFaqs?: readonly VisibleFaqItem[] | null;
}) {
  const canonical = getSiteUrl(input.path);
  const webPageId = getWebPageId(input.path);

  return [
    buildOrganization(),
    buildWebSite(),
    buildWebPage({
      id: webPageId,
      name: input.headline,
      description: input.description,
      url: canonical,
      dateModified: input.dateModified,
    }),
    buildArticle({
      id: getArticleId(input.path),
      headline: input.headline,
      description: input.description,
      url: canonical,
      webPageId,
      datePublished: input.datePublished,
      dateModified: input.dateModified,
      articleSection: input.articleSection,
      keywords: input.keywords,
    }),
    buildBreadcrumbEntity(input.path, input.breadcrumbs),
    input.visibleFaqs
      ? buildFaqPage({
          id: getFaqId(input.path),
          items: input.visibleFaqs,
        })
      : null,
  ];
}

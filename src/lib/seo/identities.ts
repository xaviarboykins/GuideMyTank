import { getSiteUrl } from "./site-url";

export const ORGANIZATION_ID = `${getSiteUrl()}/#organization`;
export const WEBSITE_ID = `${getSiteUrl()}/#website`;

export function getWebPageId(path = "/") {
  const canonical = getSiteUrl(path);
  return `${canonical}${canonical === getSiteUrl() ? "/" : ""}#webpage`;
}

export function getArticleId(path: string) {
  return `${getSiteUrl(path)}#article`;
}

export function getBreadcrumbId(path: string) {
  return `${getSiteUrl(path)}#breadcrumbs`;
}

export function getFaqId(path: string) {
  return `${getSiteUrl(path)}#faq`;
}

export function getSpeciesEntityId(slug: string) {
  return `${getSiteUrl(`/species/${slug}`)}#species`;
}

export function getItemListId(path: string) {
  return `${getSiteUrl(path)}#itemlist`;
}

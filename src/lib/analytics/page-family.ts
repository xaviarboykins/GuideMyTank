export const ANALYTICS_PAGE_FAMILIES = [
  "homepage",
  "species",
  "care_guide",
  "article",
  "guide",
  "compatibility_report",
  "learning_center",
  "product_category",
  "aquarium_builder",
  "static",
] as const;

export type AnalyticsPageFamily = (typeof ANALYTICS_PAGE_FAMILIES)[number];

export function getAnalyticsPageFamily(pathname: string): AnalyticsPageFamily {
  if (pathname === "/") return "homepage";
  if (/^\/species\/[^/]+$/.test(pathname)) return "species";
  if (/^\/care-guides\/[^/]+$/.test(pathname)) return "care_guide";
  if (/^\/learning-center\/guides\/[^/]+$/.test(pathname)) return "guide";
  if (
    pathname === "/learning-center" ||
    pathname === "/learning-center/articles" ||
    pathname === "/learning-center/guides"
  ) {
    return "learning_center";
  }
  if (/^\/learning-center\/[^/]+$/.test(pathname)) return "article";
  if (/^\/compatibility\/[^/]+\/[^/]+$/.test(pathname)) {
    return "compatibility_report";
  }
  if (pathname.startsWith("/learning-center")) return "learning_center";
  if (
    pathname === "/products" ||
    /^\/aquarium-builder\/products\/[^/]+$/.test(pathname)
  ) {
    return "product_category";
  }
  if (pathname.startsWith("/aquarium-builder")) return "aquarium_builder";
  return "static";
}

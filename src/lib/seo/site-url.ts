const PRODUCTION_SITE_ORIGIN = "https://www.guidemytank.com";

function normalizePath(path: string) {
  const trimmedPath = path.trim();

  if (/^https?:\/\//i.test(trimmedPath)) {
    const url = new URL(trimmedPath);

    if (
      url.hostname !== "guidemytank.com" &&
      url.hostname !== "www.guidemytank.com"
    ) {
      throw new Error("GuideMyTank URLs must use the canonical production host.");
    }

    return `${url.pathname}${url.search}${url.hash}`;
  }

  return trimmedPath.startsWith("/") ? trimmedPath : `/${trimmedPath}`;
}

export function getSiteOrigin() {
  return PRODUCTION_SITE_ORIGIN;
}

export function getSiteUrl(path = "/") {
  const normalizedPath = normalizePath(path);
  const url = new URL(normalizedPath, `${getSiteOrigin()}/`);

  url.search = "";
  url.hash = "";

  return url.toString().replace(/\/$/, normalizedPath === "/" ? "" : "/");
}


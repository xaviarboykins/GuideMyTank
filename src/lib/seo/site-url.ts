const PRODUCTION_SITE_ORIGIN = "https://www.guidemytank.com";
const DEVELOPMENT_SITE_ORIGIN = "http://localhost:3000";

function normalizeOrigin(value: string) {
  const url = new URL(value);

  if (url.hostname === "guidemytank.com" || url.hostname === "www.guidemytank.com") {
    url.protocol = "https:";
    url.hostname = "www.guidemytank.com";
  }

  url.pathname = "/";
  url.search = "";
  url.hash = "";

  return url.origin;
}

export function getSiteOrigin() {
  const configuredOrigin = process.env.SITE_URL?.trim();

  if (configuredOrigin) {
    try {
      return normalizeOrigin(configuredOrigin);
    } catch {
      throw new Error("SITE_URL must be a valid absolute URL.");
    }
  }

  return process.env.NODE_ENV === "development"
    ? DEVELOPMENT_SITE_ORIGIN
    : PRODUCTION_SITE_ORIGIN;
}

export function getSiteUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(normalizedPath, `${getSiteOrigin()}/`);

  url.search = "";
  url.hash = "";

  return url.toString().replace(/\/$/, normalizedPath === "/" ? "" : "/");
}


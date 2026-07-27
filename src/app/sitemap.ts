import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/seo/site-url";

const STATIC_PATHS = [
  "/",
  "/piscidex",
  "/species",
  "/care-guides",
  "/compatibility",
  "/compatibility/disclaimer",
  "/aquarium-builder",
  "/products",
  "/learning-center",
  "/learning-center/articles",
  "/learning-center/guides",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/affiliate-disclosure",
  "/disclaimer",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return STATIC_PATHS.map((path) => ({ url: getSiteUrl(path) }));
}

import type { Metadata } from "next";

import { getSiteUrl } from "./site-url";

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  robots?: Metadata["robots"];
  publishedTime?: string | null;
  modifiedTime?: string | null;
};

export function getBrandedTitle(title: string) {
  return /\|\s*GuideMyTank\s*$/i.test(title.trim())
    ? title.trim()
    : `${title.trim()} | GuideMyTank`;
}

export function buildPageMetadata({
  title,
  description,
  path,
  type = "website",
  robots,
  publishedTime,
  modifiedTime,
}: PageMetadataInput): Metadata {
  const brandedTitle = getBrandedTitle(title);
  const canonical = getSiteUrl(path);

  return {
    title: brandedTitle,
    description,
    alternates: { canonical },
    openGraph: {
      title: brandedTitle,
      description,
      url: canonical,
      siteName: "GuideMyTank",
      type,
      ...(type === "article" && publishedTime
        ? { publishedTime }
        : {}),
      ...(type === "article" && modifiedTime ? { modifiedTime } : {}),
    },
    twitter: {
      card: "summary",
      title: brandedTitle,
      description,
    },
    ...(robots ? { robots } : {}),
  };
}

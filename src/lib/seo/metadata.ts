import type { Metadata } from "next";

import { getSiteUrl } from "./site-url";

type MetadataImage = {
  url: string;
  alt: string;
  width?: number;
  height?: number;
};

export type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  robots?: Metadata["robots"];
  image?: MetadataImage | null;
  publishedTime?: string | null;
  modifiedTime?: string | null;
  publisher?: string | null;
};

export function getBrandedTitle(title: string) {
  return /\|\s*GuideMyTank\s*$/i.test(title.trim())
    ? title.trim()
    : `${title.trim()} | GuideMyTank`;
}

function getMetadataImage(image: MetadataImage | null | undefined) {
  if (!image?.url.trim() || !image.alt.trim()) {
    return null;
  }

  const url = /^https?:\/\//i.test(image.url)
    ? new URL(image.url).toString()
    : getSiteUrl(image.url);

  return {
    url,
    alt: image.alt.trim(),
    ...(image.width ? { width: image.width } : {}),
    ...(image.height ? { height: image.height } : {}),
  };
}

export function buildPageMetadata({
  title,
  description,
  path,
  type = "website",
  robots,
  image,
  publishedTime,
  modifiedTime,
  publisher,
}: PageMetadataInput): Metadata {
  const brandedTitle = getBrandedTitle(title);
  const canonical = getSiteUrl(path);
  const metadataImage = getMetadataImage(image);

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
      ...(metadataImage ? { images: [metadataImage] } : {}),
      ...(type === "article" && publishedTime
        ? { publishedTime }
        : {}),
      ...(type === "article" && modifiedTime ? { modifiedTime } : {}),
    },
    twitter: {
      card: metadataImage ? "summary_large_image" : "summary",
      title: brandedTitle,
      description,
      ...(metadataImage ? { images: [metadataImage] } : {}),
    },
    ...(robots ? { robots } : {}),
    ...(publisher?.trim() ? { publisher: publisher.trim() } : {}),
  };
}

"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

import {
  resolveSpeciesImage,
  SPECIES_PLACEHOLDER_IMAGE,
} from "@/lib/images";

type SpeciesImageProps = Omit<ImageProps, "alt" | "onError" | "src"> & {
  alt?: string;
  commonName: string;
  legacySource?: string | null;
  slug: string;
};

export function SpeciesImage({
  alt,
  commonName,
  legacySource,
  slug,
  ...props
}: SpeciesImageProps) {
  const resolvedSource = resolveSpeciesImage(slug, legacySource);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const source = failedSource === resolvedSource
    ? SPECIES_PLACEHOLDER_IMAGE
    : resolvedSource;

  return (
    <Image
      {...props}
      src={source}
      alt={alt ?? `${commonName} aquarium species`}
      onError={() => {
        if (source !== SPECIES_PLACEHOLDER_IMAGE) {
          setFailedSource(source);
        }
      }}
    />
  );
}

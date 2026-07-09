"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";

import type { ProductCategory } from "@/lib/products/types";

type ProductThumbnailProps = {
  alt: string;
  category?: ProductCategory;
  imageUrl?: string | null;
  size?: "sm" | "md";
};

const sizeClasses = {
  sm: "size-10",
  md: "size-12",
};

function getCategoryInitial(category: ProductCategory | undefined) {
  if (!category) {
    return "P";
  }

  return category.charAt(0).toUpperCase();
}

export function ProductThumbnail({
  alt,
  category,
  imageUrl,
  size = "md",
}: ProductThumbnailProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const [preview, setPreview] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const className = [
    "relative shrink-0 overflow-hidden border border-border bg-muted",
    sizeClasses[size],
  ].join(" ");
  const fallback = getCategoryInitial(category);
  const resolvedImageUrl = imageUrl || undefined;
  const shouldShowImage = Boolean(resolvedImageUrl) && !imageFailed;

  return (
    <>
      <div
        className={
          shouldShowImage
            ? className
            : [
                className,
                "flex items-center justify-center text-xs font-bold text-muted-foreground",
              ].join(" ")
        }
        onMouseEnter={(event) =>
          setPreview({
            x: event.clientX,
            y: event.clientY,
          })
        }
        onMouseMove={(event) =>
          setPreview({
            x: event.clientX,
            y: event.clientY,
          })
        }
        onMouseLeave={() => setPreview(null)}
        aria-hidden={!shouldShowImage}
      >
        {shouldShowImage ? (
          // Product images may come from external product sources, so use a
          // plain image tag instead of requiring Next.js remote allowlists.
          <img
            src={resolvedImageUrl}
            alt={alt}
            className="size-full object-contain p-1"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
          />
        ) : (
          fallback
        )}
      </div>

      {preview ? (
        <div
          className="pointer-events-none fixed z-50 hidden border border-border bg-card p-3 shadow-xl md:block"
          style={{
            left: preview.x + 16,
            top: preview.y - 80,
          }}
        >
          <div className="relative flex size-40 items-center justify-center bg-muted text-3xl font-bold text-muted-foreground">
            {shouldShowImage ? (
              <img
                src={resolvedImageUrl}
                alt={`${alt} product preview`}
                className="size-full object-contain p-2"
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={() => setImageFailed(true)}
              />
            ) : (
              fallback
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

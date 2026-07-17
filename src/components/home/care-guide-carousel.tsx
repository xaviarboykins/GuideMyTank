"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";

export type FeaturedCareGuide = {
  slug: string;
  name: string;
  scientificName: string;
  image: string;
  careLevel: string;
  tankSize: string;
  temperament: string;
  summary: string;
};

export function CareGuideCarousel({ guides }: { guides: FeaturedCareGuide[] }) {
  const [startIndex, setStartIndex] = useState(0);

  useEffect(() => {
    if (guides.length <= 3) return;

    const interval = window.setInterval(() => {
      setStartIndex((current) => (current + 1) % guides.length);
    }, 180000);

    return () => window.clearInterval(interval);
  }, [guides.length]);

  const visibleGuides = useMemo(
    () =>
      Array.from(
        { length: Math.min(3, guides.length) },
        (_, offset) => guides[(startIndex + offset) % guides.length],
      ),
    [guides, startIndex],
  );

  function rotate(direction: number) {
    setStartIndex(
      (current) => (current + direction + guides.length) % guides.length,
    );
  }

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-3">
        {visibleGuides.map((guide) => (
          <article
            key={guide.slug}
            className="overflow-hidden rounded-lg border border-border bg-card"
          >
            <Link href={`/care-guides/${guide.slug}`} className="group block">
              <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                <Image
                  src={guide.image}
                  alt={guide.name}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </div>

              <div className="p-4">
                <h3 className="text-lg font-semibold group-hover:underline">
                  {guide.name} Care Guide
                </h3>
                <p className="mt-1 text-xs italic text-muted-foreground">
                  {guide.scientificName}
                </p>
                <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                  {guide.summary}
                </p>

                <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3 text-xs">
                  <div>
                    <dt className="text-muted-foreground">Care</dt>
                    <dd className="mt-1 font-semibold">{guide.careLevel}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Tank</dt>
                    <dd className="mt-1 font-semibold">{guide.tankSize}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Nature</dt>
                    <dd className="mt-1 truncate font-semibold">
                      {guide.temperament}
                    </dd>
                  </div>
                </dl>
              </div>
            </Link>
          </article>
        ))}
      </div>

      {guides.length > 3 ? (
        <div className="mt-4 flex items-center justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Previous care guides"
            onClick={() => rotate(-1)}
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </Button>
          <p className="text-xs text-muted-foreground">
            Featured guides rotate automatically
          </p>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Next care guides"
            onClick={() => rotate(1)}
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}

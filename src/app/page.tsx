import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, CheckCircle2, Fish, Wrench } from "lucide-react";

import {
  CareGuideCarousel,
  type FeaturedCareGuide,
} from "@/components/home/care-guide-carousel";
import { BetaBadge } from "@/components/site/beta-badge";
import { DevelopmentBadge } from "@/components/site/development-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listPublishedCareGuides } from "@/lib/care-guides/service";
import { createPublishedContentImageSignedUrls } from "@/lib/content-images/service";

const utilities = [
  {
    title: "Aquarium Builder",
    description:
      "Build your freshwater aquarium and receive stocking, compatibility, equipment, temperature, and setup guidance in one place.",
    href: "/aquarium-builder",
    status: "beta",
  },
  {
    title: "Compatibility Checker",
    description:
      "Quickly compare species using temperament, aggression, water parameters, schooling behavior, and tank requirements.",
    href: "/compatibility",
    status: "beta",
  },
  {
    title: "Care Guides",
    description:
      "Browse practical species profiles covering care, behavior, habitat, feeding, water needs, and aquarium requirements.",
    href: "/care-guides",
    status: null,
  },
  {
    title: "Products",
    description:
      "Explore a structured catalog of tanks, filters, heaters, lighting, substrate, decor, and other aquarium equipment.",
    href: "/products",
    status: null,
  },
];

export const metadata: Metadata = {
  title: "GuideMyTank | Aquarium Compatibility and Tank Planning Tools",
  description:
    "Search freshwater species, compare tank mate compatibility, estimate stocking levels, and plan an aquarium build.",
};

export const revalidate = 3600;

export default async function Home() {
  const publishedGuides = await listPublishedCareGuides();
  const primaryImages = publishedGuides.map((guide) => guide.care_guide_images.find((image) => image.is_primary) ?? guide.care_guide_images[0]).filter(Boolean);
  const imageUrls = await createPublishedContentImageSignedUrls(primaryImages.map((image) => image.content_images.storage_path));
  const featuredCareGuides: FeaturedCareGuide[] = publishedGuides.map((guide) => {
    const image = guide.care_guide_images.find((item) => item.is_primary) ?? guide.care_guide_images[0];
    return {
      slug: guide.slug ?? guide.species.slug,
      title: guide.title ?? `${guide.species.common_name} Care Guide`,
      name: guide.species.common_name,
      scientificName: guide.species.scientific_name,
      image: image ? imageUrls.get(image.content_images.storage_path) ?? "" : "",
      imageAlt: image?.content_images.alt_text ?? `${guide.species.common_name} Care Guide`,
      careLevel: guide.species.care_level ?? "Unknown",
      tankSize: guide.species.tank_size_gal ? `${guide.species.tank_size_gal}+ gal` : "Unknown",
      temperament: guide.species.temperament ?? "Unknown",
      summary: guide.summary ?? guide.species.summary ?? "Freshwater aquarium care requirements and compatibility guidance.",
    };
  });
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Main Utility Header */}
      <section className="border border-border bg-card p-6">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm font-medium text-muted-foreground">
            Freshwater Aquarium Utility Platform
          </p>
          <DevelopmentBadge />
        </div>

        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Aquarium compatibility and tank planning tools.
        </h1>

        <p className="mt-4 max-w-3xl text-muted-foreground">
          Search fish species, compare compatibility, estimate stocking levels,
          and plan healthier freshwater aquariums using practical database-style
          tools.
        </p>

        <form
          action="/piscidex"
          method="get"
          className="mt-6 flex flex-col gap-3 sm:flex-row"
        >
          <Input
            name="q"
            placeholder="Search fish, shrimp, snails, plants..."
          />

          <Button type="submit">Search</Button>
        </form>

        {/* Quick Links */}
        <div className="mt-6 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/piscidex">PisciDex</Link>
          </Button>

          <Button variant="outline" size="sm" asChild>
            <Link href="/compatibility">Compatibility Checker</Link>
          </Button>

          <Button variant="outline" size="sm" asChild>
            <Link href="/care-guides">Care Guides</Link>
          </Button>

          <Button variant="outline" size="sm" asChild>
            <Link href="/aquarium-builder">Aquarium Builder</Link>
          </Button>

          <Button variant="outline" size="sm" asChild>
            <Link href="/products">Products</Link>
          </Button>
        </div>
      </section>

      {/* Builder Feature */}
      <section className="mt-6 overflow-hidden rounded-lg border border-sky-200 bg-sky-950 text-white dark:border-sky-900">
        <div className="grid items-center gap-8 p-6 md:grid-cols-[1fr_1.2fr] md:p-10">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm font-semibold uppercase tracking-wide text-sky-300">
                Featured Planning Tool
              </p>
              <BetaBadge />
            </div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">
              Build your aquarium before you buy.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-sky-100/80">
              Build your freshwater aquarium and receive stocking,
              compatibility, equipment, temperature, and setup guidance in one
              practical workspace. Your build is saved in your browser as you
              plan.
            </p>

            <Button asChild className="mt-6 bg-sky-500 text-white hover:bg-sky-400">
              <Link href="/aquarium-builder">
                <Wrench className="size-4" aria-hidden="true" />
                Start Your Tank Build
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>

          <div className="rounded-lg border border-white/15 bg-white/10 p-5">
            <h3 className="font-semibold">One build, every essential</h3>
            <ul className="mt-4 grid gap-3 text-sm text-sky-50 sm:grid-cols-2">
              {[
                "Tank and equipment selection",
                "Live stocking overview",
                "Filtration and heating status",
                "Plants, substrate, and decor",
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <CheckCircle2
                    className="mt-0.5 size-4 shrink-0 text-emerald-400"
                    aria-hidden="true"
                  />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Featured Care Guides */}
      <section className="mt-6 rounded-lg border border-border bg-muted/40 p-6 md:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Fish className="size-4" aria-hidden="true" />
              Species Care Guides
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              Plan around the fish, not just the tank.
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Quick, practical care profiles covering tank size, temperament,
              water needs, diet, and compatible tank mates.
            </p>
          </div>

          <Button variant="outline" asChild>
            <Link href="/care-guides">
              View All Care Guides
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>

        <CareGuideCarousel guides={featuredCareGuides} />
      </section>

      {/* Utility Grid */}
      <section aria-label="Aquarium tools" className="mt-6 grid gap-4 md:grid-cols-2">
        {utilities.map((utility) => (
          <Link
            key={utility.href}
            href={utility.href}
            className="group border border-border bg-card p-4 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold group-hover:underline">
                {utility.title}
              </h2>
              {utility.status === "beta" ? <BetaBadge /> : null}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {utility.description}
            </p>
            <span className="mt-4 inline-block text-sm font-medium">
              Open tool →
            </span>
          </Link>
        ))}
      </section>

    </div>
  );
}

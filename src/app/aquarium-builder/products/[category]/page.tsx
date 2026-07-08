import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageContainer } from "@/components/site/page-container";
import { PageHeader } from "@/components/site/page-header";
import { Button } from "@/components/ui/button";
import {
  aquariumBuilderProductCategories,
  getAquariumBuilderProductCategory,
} from "@/lib/aquarium-builder/product-categories";

type AquariumBuilderProductsPageProps = {
  params: Promise<{
    category: string;
  }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return aquariumBuilderProductCategories.map((category) => ({
    category: category.slug,
  }));
}

export async function generateMetadata({
  params,
}: AquariumBuilderProductsPageProps): Promise<Metadata> {
  const { category: categorySlug } = await params;
  const category = getAquariumBuilderProductCategory(categorySlug);

  if (!category) {
    return {
      title: "Aquarium Builder Products Not Found | GuideMyTank",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    title: `${category.heading} | Aquarium Builder | GuideMyTank`,
    description: `${category.label} browsing for the GuideMyTank Aquarium Builder will be implemented in a future milestone.`,
  };
}

export default async function AquariumBuilderProductsPage({
  params,
}: AquariumBuilderProductsPageProps) {
  const { category: categorySlug } = await params;
  const category = getAquariumBuilderProductCategory(categorySlug);

  if (!category) {
    notFound();
  }

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Aquarium Builder Products"
        title={category.heading}
        description={`${category.label} browsing will be implemented in a future milestone. This placeholder route is here so builder navigation can be wired before real product data exists.`}
      />

      <section className="mt-6 border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Product browsing coming later</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
          This page will eventually list relevant aquarium products and allow
          selections to flow back into the builder. For now, no product data,
          filtering, affiliate links, or saved-build behavior is implemented.
        </p>

        <div className="mt-5">
          <Button asChild>
            <Link href="/aquarium-builder">Back to Aquarium Builder</Link>
          </Button>
        </div>
      </section>
    </PageContainer>
  );
}

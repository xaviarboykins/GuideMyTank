import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BuilderProductPickerInterface } from "@/components/products/builder-product-picker-interface";
import { PageContainer } from "@/components/site/page-container";
import { PageHeader } from "@/components/site/page-header";
import {
  aquariumBuilderProductCategories,
  getAquariumBuilderProductCategory,
} from "@/lib/aquarium-builder/product-categories";
import { getBuilderProducts } from "@/lib/products/service";
import { isProductCategory } from "@/lib/products/types";
import type { ProductCategory } from "@/lib/products/types";

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

  if (!category || !isProductCategory(categorySlug)) {
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
    description: `Browse ${category.label.toLowerCase()} for the GuideMyTank Aquarium Builder.`,
  };
}

export default async function AquariumBuilderProductsPage({
  params,
}: AquariumBuilderProductsPageProps) {
  const { category: categorySlug } = await params;
  const category = getAquariumBuilderProductCategory(categorySlug);

  if (!category || !isProductCategory(categorySlug)) {
    notFound();
  }

  const productCategory: ProductCategory = categorySlug;
  const products = await getBuilderProducts({
    category: productCategory,
  });

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Aquarium Builder Products"
        title={category.heading}
        description={`Choose ${category.label.toLowerCase()} from the shared Product Catalog. Selections are saved by product ID for the current aquarium build and validation.`}
      />

      <BuilderProductPickerInterface
        category={productCategory}
        products={products}
      />
    </PageContainer>
  );
}

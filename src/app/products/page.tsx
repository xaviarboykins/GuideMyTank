import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";

import { PageContainer } from "@/components/site/page-container";
import { PageHeader } from "@/components/site/page-header";
import { ProductAddButton } from "@/components/products/product-add-button";
import { ProductRating } from "@/components/products/product-rating";
import { ProductThumbnail } from "@/components/products/product-thumbnail";
import { PriceFilterSlider } from "@/components/products/price-filter-slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { productCategoryLabels, productCategories } from "@/lib/products/types";
import type {
  Product,
  ProductCategory,
  ProductDifficulty,
} from "@/lib/products/types";
import { searchProducts } from "@/lib/products/service";

type ProductsPageProps = {
  searchParams: Promise<ProductFilterSearchParams>;
};

type ProductFilterSearchParams = Record<
  string,
  string | string[] | undefined
>;

type ProductPageFilters = {
  query?: string;
  category?: ProductCategory;
  brand?: string;
  tankSizeGallons?: number;
  priceMax?: number;
  ratings: number[];
  plantedTank?: boolean;
  difficulty?: ProductDifficulty;
};

const tankSizeOptions = [3, 5, 10, 15, 20, 29, 40, 55, 75];
const priceMaxDefault = 200;
const ratingOptions = [5, 4, 3];
const difficultyOptions: ProductDifficulty[] = [
  "beginner",
  "intermediate",
  "advanced",
];

export const metadata: Metadata = {
  title: "Aquarium Product Catalog | GuideMyTank",
  description:
    "Browse aquarium tanks, filters, heaters, lighting, substrate, and decor for freshwater tank planning.",
};

export const revalidate = 86400;

function getFirstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseTextFilter(value: string | string[] | undefined) {
  const parsedValue = getFirstSearchParam(value)?.trim();

  return parsedValue ? parsedValue : undefined;
}

function parseNumberFilter(value: string | string[] | undefined) {
  const parsedValue = Number(getFirstSearchParam(value));

  return Number.isFinite(parsedValue) && parsedValue > 0
    ? parsedValue
    : undefined;
}

function parseBooleanFilter(value: string | string[] | undefined) {
  const parsedValue = getFirstSearchParam(value);

  if (!parsedValue) {
    return undefined;
  }

  return ["1", "true", "yes", "on"].includes(parsedValue.toLowerCase());
}

function parseRatingFilters(value: string | string[] | undefined) {
  const values = Array.isArray(value) ? value : value ? [value] : [];

  return values
    .map((item) => Number(item))
    .filter((item) => ratingOptions.includes(item));
}

function parseDifficultyFilter(value: string | string[] | undefined) {
  const parsedValue = parseTextFilter(value);

  if (!parsedValue) {
    return undefined;
  }

  return difficultyOptions.includes(parsedValue as ProductDifficulty)
    ? (parsedValue as ProductDifficulty)
    : undefined;
}

function parseCategoryFilter(value: string | string[] | undefined) {
  const parsedValue = parseTextFilter(value);

  if (!parsedValue) {
    return undefined;
  }

  return productCategories.includes(parsedValue as ProductCategory)
    ? (parsedValue as ProductCategory)
    : undefined;
}

function parseProductFilters(
  searchParams: ProductFilterSearchParams,
): ProductPageFilters {
  return {
    query: parseTextFilter(searchParams.q),
    category: parseCategoryFilter(searchParams.category),
    brand: parseTextFilter(searchParams.brand),
    tankSizeGallons: parseNumberFilter(searchParams.tank),
    priceMax: parseNumberFilter(searchParams.priceMax),
    ratings: parseRatingFilters(searchParams.rating),
    plantedTank: parseBooleanFilter(searchParams.plantedTank),
    difficulty: parseDifficultyFilter(searchParams.difficulty),
  };
}

function formatCurrency(value: number | null) {
  if (value == null) {
    return "Unknown";
  }

  return `$${Math.round(value)}`;
}

function formatTankRange(product: Product) {
  const min = product.recommended_tank_min_gallons;
  const max = product.recommended_tank_max_gallons;

  if (min != null && max != null && min === max) {
    return `${min} gal`;
  }

  if (min != null && max != null) {
    return `${min}-${max} gal`;
  }

  if (min != null) {
    return `${min}+ gal`;
  }

  if (max != null) {
    return `Up to ${max} gal`;
  }

  return "Any";
}

function getKeySpecs(product: Product) {
  const specs: string[] = [];

  if (product.dimensions) {
    specs.push(product.dimensions);
  }

  if (product.flow_rate_gph != null) {
    specs.push(`${product.flow_rate_gph} GPH`);
  }

  if (product.heater_watts != null) {
    specs.push(`${product.heater_watts}W`);
  }

  if (product.light_type) {
    specs.push(product.light_type);
  }

  if (product.light_output) {
    specs.push(product.light_output);
  }

  if (product.substrate_type) {
    specs.push(product.substrate_type);
  }

  if (product.planted_tank) {
    specs.push("Planted");
  }

  return specs.length > 0 ? specs.join(" | ") : "General aquarium use";
}

function getCategoryCounts(products: Product[]) {
  return productCategories.map((category) => ({
    category,
    count: products.filter((product) => product.category === category).length,
  }));
}

function getUniqueBrands(products: Product[]) {
  return Array.from(new Set(products.map((product) => product.brand))).sort(
    (a, b) => a.localeCompare(b),
  );
}

function formatDifficulty(value: ProductDifficulty) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function applyDisplayFilters(products: Product[], filters: ProductPageFilters) {
  const minimumSelectedRating =
    filters.ratings.length > 0 ? Math.min(...filters.ratings) : null;

  return products.filter((product) => {
    if (filters.brand && product.brand !== filters.brand) {
      return false;
    }

    if (filters.difficulty && product.difficulty !== filters.difficulty) {
      return false;
    }

    if (
      filters.priceMax != null &&
      product.price_estimate != null &&
      product.price_estimate > filters.priceMax
    ) {
      return false;
    }

    if (
      minimumSelectedRating != null &&
      (product.guide_rating == null ||
        product.guide_rating < minimumSelectedRating)
    ) {
      return false;
    }

    return true;
  });
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const filters = parseProductFilters(await searchParams);
  const [baseProducts, allProducts] = await Promise.all([
    searchProducts({
      query: filters.query,
      category: filters.category,
      tankSizeGallons: filters.tankSizeGallons,
      freshwater: true,
      plantedTank: filters.plantedTank,
    }),
    searchProducts({ freshwater: true }),
  ]);
  const products = applyDisplayFilters(baseProducts, filters);
  const categoryCounts = getCategoryCounts(allProducts);
  const brandOptions = getUniqueBrands(allProducts);
  const priceMaxValue = filters.priceMax ?? priceMaxDefault;

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Product Catalog"
        title="Aquarium Products"
        description="Browse practical aquarium equipment and supplies for tank planning. Product data is rough guidance for builder validation and recommendations, not live retail pricing."
      />

      <form action="/products" method="get" className="mt-6">
        <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="min-w-0 space-y-5">
            <section className="border border-border bg-card p-4">
              <div className="text-center text-sm font-bold">Product List</div>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs font-bold uppercase">Products</dt>
                  <dd className="text-lg font-bold text-sky-700">
                    {allProducts.length}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase">Matches</dt>
                  <dd className="text-lg font-bold text-sky-700">
                    {products.length}
                  </dd>
                </div>
              </dl>

              <Button asChild variant="outline" size="sm" className="mt-4 w-full">
                <Link href="/aquarium-builder">Return to Builder</Link>
              </Button>
            </section>

            <section className="border border-border bg-card">
              <div className="border-b border-border px-4 py-3">
                <h2 className="font-semibold">Catalog Counts</h2>
              </div>
              <dl className="divide-y divide-border text-sm">
                {categoryCounts.map((item) => (
                  <div
                    key={item.category}
                    className="flex justify-between gap-4 px-4 py-2"
                  >
                    <dt className="text-muted-foreground">
                      {productCategoryLabels[item.category]}
                    </dt>
                    <dd className="font-medium">{item.count}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="border border-border bg-card">
              <div className="border-b border-border px-4 py-3">
                <h2 className="font-semibold">Filters</h2>
              </div>

              <div className="space-y-4 p-4 text-sm">
                <label className="block">
                  <span className="text-xs font-bold uppercase">Category</span>
                  <select
                    name="category"
                    defaultValue={filters.category ?? ""}
                    className="mt-2 h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
                  >
                    <option value="">All</option>
                    {productCategories.map((category) => (
                      <option key={category} value={category}>
                        {productCategoryLabels[category]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-bold uppercase">Tank Size</span>
                  <select
                    name="tank"
                    defaultValue={filters.tankSizeGallons ?? ""}
                    className="mt-2 h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
                  >
                    <option value="">All</option>
                    {tankSizeOptions.map((gallons) => (
                      <option key={gallons} value={gallons}>
                        {gallons} gal
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-bold uppercase">Brand</span>
                  <select
                    name="brand"
                    defaultValue={filters.brand ?? ""}
                    className="mt-2 h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
                  >
                    <option value="">All</option>
                    {brandOptions.map((brand) => (
                      <option key={brand} value={brand}>
                        {brand}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-bold uppercase">Difficulty</span>
                  <select
                    name="difficulty"
                    defaultValue={filters.difficulty ?? ""}
                    className="mt-2 h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
                  >
                    <option value="">All</option>
                    {difficultyOptions.map((difficulty) => (
                      <option key={difficulty} value={difficulty}>
                        {formatDifficulty(difficulty)}
                      </option>
                    ))}
                  </select>
                </label>

                <PriceFilterSlider
                  defaultValue={priceMaxValue}
                  max={priceMaxDefault}
                />

                <fieldset>
                  <legend className="text-xs font-bold uppercase">
                    Tank Type
                  </legend>
                  <div className="mt-2 space-y-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="plantedTank"
                        value="true"
                        defaultChecked={filters.plantedTank}
                        className="size-4 rounded border-input"
                      />
                      <span>Planted tank</span>
                    </label>
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="text-xs font-bold uppercase">
                    Ratings
                  </legend>
                  <div className="mt-2 space-y-2">
                    {ratingOptions.map((rating) => (
                      <label
                        key={rating}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          name="rating"
                          value={rating}
                          defaultChecked={filters.ratings.includes(rating)}
                          className="size-4 rounded border-input"
                        />
                        <span>{rating}+ stars</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div className="flex gap-2">
                  <Button type="submit" size="sm" className="flex-1">
                    Apply
                  </Button>
                  <Button
                    asChild
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Link href="/products">Reset</Link>
                  </Button>
                </div>
              </div>
            </section>
          </aside>

          <section className="min-w-0">
            <div className="mb-3 flex flex-col gap-3 border-b border-border pb-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  {products.length} Product Results
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Active products are sorted by category, brand, and title.
                  Showing {products.length} of {allProducts.length}.
                </p>
              </div>

              <div className="flex w-full items-center gap-2 md:w-80">
                <Search className="size-4 shrink-0 text-muted-foreground" />
                <Input
                  name="q"
                  defaultValue={filters.query}
                  placeholder="Search products"
                />
              </div>
            </div>

          {products.length === 0 ? (
            <div className="border border-border bg-card p-6 text-sm text-muted-foreground">
              No products match the current filters.
            </div>
          ) : (
            <div className="overflow-x-auto border border-border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] table-fixed border-collapse text-sm">
                  <thead className="bg-muted text-left text-xs">
                    <tr>
                      <th scope="col" className="w-[30%] px-2 py-2 font-semibold">
                        Product
                      </th>
                      <th scope="col" className="w-[11%] px-2 py-2 font-semibold">
                        Category
                      </th>
                      <th scope="col" className="w-[11%] px-2 py-2 font-semibold">
                        Tank
                      </th>
                      <th scope="col" className="w-[21%] px-2 py-2 font-semibold">
                        Specs
                      </th>
                      <th scope="col" className="w-[9%] px-2 py-2 font-semibold">
                        Rating
                      </th>
                      <th scope="col" className="w-[8%] px-2 py-2 font-semibold">
                        Price
                      </th>
                      <th scope="col" className="w-[10%] py-2 pl-2 pr-3 text-right font-semibold">
                        Add
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id} className="border-t border-border">
                        <td className="px-2 py-2 align-top">
                          <div className="flex items-center gap-3">
                            <ProductThumbnail
                              alt={product.title}
                              category={product.category}
                              imageUrl={product.image_url}
                            />
                            <div className="min-w-0">
                              <div className="font-semibold">
                                {product.title}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {product.brand}
                                {product.model ? ` ${product.model}` : ""}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-2 align-top">
                          {productCategoryLabels[product.category]}
                        </td>
                        <td className="px-2 py-2 align-top">
                          {formatTankRange(product)}
                        </td>
                        <td className="px-2 py-2 align-top text-muted-foreground">
                          {getKeySpecs(product)}
                        </td>
                        <td className="px-2 py-2 align-top">
                          <ProductRating value={product.guide_rating} />
                        </td>
                        <td className="px-2 py-2 align-top">
                          {formatCurrency(product.price_estimate)}
                        </td>
                        <td className="py-2 pl-2 pr-3 text-right align-top">
                          <ProductAddButton product={product} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          </section>
        </div>
      </form>
    </PageContainer>
  );
}

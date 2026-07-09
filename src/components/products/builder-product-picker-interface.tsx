"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { ProductAddButton } from "@/components/products/product-add-button";
import { ProductRating } from "@/components/products/product-rating";
import { ProductThumbnail } from "@/components/products/product-thumbnail";
import { Button } from "@/components/ui/button";
import type {
  AquariumBuild,
  AquariumEquipmentProduct,
} from "@/lib/aquarium-builder/types";
import {
  AQUARIUM_BUILDER_STORAGE_KEY,
  defaultAquariumBuild,
  parseAquariumBuild,
} from "@/lib/aquarium-builder/storage";
import {
  getProductKeySpecs,
  getProductTankRange,
  mapProductCategoryToEquipmentCategory,
} from "@/lib/products/builder";
import {
  productCategoryLabels,
  type Product,
  type ProductCategory,
} from "@/lib/products/types";

type BuilderProductPickerInterfaceProps = {
  category: ProductCategory;
  products: Product[];
};

function getSavedBuild() {
  return parseAquariumBuild(
    window.localStorage.getItem(AQUARIUM_BUILDER_STORAGE_KEY),
  );
}

function formatCurrency(value: number | null) {
  if (value == null) {
    return "Unknown";
  }

  return `$${Math.round(value)}`;
}

function getEquipmentTotal(equipment: AquariumEquipmentProduct[]) {
  return equipment.reduce((total, item) => {
    return total + item.estimatedPrice * item.quantity;
  }, 0);
}

function getProductCategoryForEquipment(
  item: AquariumEquipmentProduct,
): ProductCategory | undefined {
  if (item.category === "tank") {
    return "tanks";
  }

  if (item.category === "filter") {
    return "filters";
  }

  if (item.category === "heater") {
    return "heaters";
  }

  if (item.category === "lighting") {
    return "lighting";
  }

  if (item.category === "substrate") {
    return "substrate";
  }

  if (item.category === "hardscape") {
    return "decor";
  }

  return undefined;
}

function getCategorySpec(product: Product) {
  if (product.category === "filters" && product.flow_rate_gph != null) {
    return `${product.flow_rate_gph} GPH`;
  }

  if (product.category === "heaters" && product.heater_watts != null) {
    return `${product.heater_watts}W`;
  }

  if (product.category === "lighting") {
    return [product.light_type, product.light_output]
      .filter(Boolean)
      .join(" | ");
  }

  if (product.category === "substrate" && product.substrate_type) {
    return product.substrate_type;
  }

  if (product.dimensions) {
    return product.dimensions;
  }

  return getProductKeySpecs(product);
}

function productFitsTankSize(product: Product, gallons: number | null) {
  if (gallons == null) {
    return true;
  }

  const min = product.recommended_tank_min_gallons;
  const max = product.recommended_tank_max_gallons;

  return (min == null || min <= gallons) && (max == null || max >= gallons);
}

function productFitsPlantedSetup(product: Product, plantedSetup: boolean) {
  if (!plantedSetup) {
    return true;
  }

  return product.planted_tank;
}

function sortBuilderProducts(
  products: Product[],
  gallons: number | null,
  plantedSetup: boolean,
) {
  return [...products].sort((firstProduct, secondProduct) => {
    const firstTankFit = productFitsTankSize(firstProduct, gallons) ? 1 : 0;
    const secondTankFit = productFitsTankSize(secondProduct, gallons) ? 1 : 0;

    if (firstTankFit !== secondTankFit) {
      return secondTankFit - firstTankFit;
    }

    const firstPlantedFit = productFitsPlantedSetup(
      firstProduct,
      plantedSetup,
    )
      ? 1
      : 0;
    const secondPlantedFit = productFitsPlantedSetup(
      secondProduct,
      plantedSetup,
    )
      ? 1
      : 0;

    if (firstPlantedFit !== secondPlantedFit) {
      return secondPlantedFit - firstPlantedFit;
    }

    return (
      (secondProduct.guide_rating ?? 0) - (firstProduct.guide_rating ?? 0) ||
      (firstProduct.price_estimate ?? 9999) -
        (secondProduct.price_estimate ?? 9999) ||
      firstProduct.title.localeCompare(secondProduct.title)
    );
  });
}

export function BuilderProductPickerInterface({
  category,
  products,
}: BuilderProductPickerInterfaceProps) {
  const [build, setBuild] = useState<AquariumBuild>(defaultAquariumBuild);
  const [matchTankSize, setMatchTankSize] = useState(false);
  const [matchPlantedSetup, setMatchPlantedSetup] = useState(false);
  const equipmentCategory = mapProductCategoryToEquipmentCategory(category);
  const selectedEquipment = useMemo(() => {
    return build.equipment.filter((item) => {
      return item.category === equipmentCategory;
    });
  }, [build.equipment, equipmentCategory]);
  const tankSizeGallons =
    build.tank.sizeGallons > 0 ? build.tank.sizeGallons : null;
  const plantedSetup =
    build.tank.plantedLevel !== "none" || build.plants.length > 0;
  const estimatedCost = getEquipmentTotal(build.equipment);
  const visibleProducts = useMemo(() => {
    const filteredProducts = products.filter((product) => {
      if (
        matchTankSize &&
        !productFitsTankSize(product, tankSizeGallons)
      ) {
        return false;
      }

      if (
        matchPlantedSetup &&
        !productFitsPlantedSetup(product, plantedSetup)
      ) {
        return false;
      }

      return true;
    });

    return sortBuilderProducts(filteredProducts, tankSizeGallons, plantedSetup);
  }, [matchPlantedSetup, matchTankSize, plantedSetup, products, tankSizeGallons]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const savedBuild = getSavedBuild();
      const hasTankSize = savedBuild.tank.sizeGallons > 0;
      const hasPlantedSetup =
        savedBuild.tank.plantedLevel !== "none" || savedBuild.plants.length > 0;

      setBuild(savedBuild);
      setMatchTankSize(hasTankSize);
      setMatchPlantedSetup(hasPlantedSetup);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <section className="mt-6">
      <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="min-w-0 space-y-5">
          <section className="border border-border bg-card p-4">
            <div className="text-center text-sm font-bold">Equipment List</div>

            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs font-bold uppercase">Products</dt>
                <dd className="text-lg font-bold text-sky-700">
                  {visibleProducts.length}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase">Selected</dt>
                <dd className="text-lg font-bold text-sky-700">
                  {selectedEquipment.length}
                </dd>
              </div>
            </dl>

            <Button asChild variant="outline" size="sm" className="mt-4 w-full">
              <Link href="/aquarium-builder">Return to Builder</Link>
            </Button>
          </section>

          <section className="border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <h2 className="font-semibold">Current Selected Products</h2>
            </div>

            {selectedEquipment.length > 0 ? (
              <ul className="divide-y divide-border">
                {selectedEquipment.map((item) => (
                  <li
                    key={`${item.category}-${item.productId ?? item.name}`}
                    className="p-3"
                  >
                    <div className="flex items-center gap-3">
                      <ProductThumbnail
                        alt={item.name}
                        category={getProductCategoryForEquipment(item)}
                        imageUrl={item.imageUrl}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold">
                          {item.name}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          Qty {item.quantity} |{" "}
                          {formatCurrency(item.estimatedPrice)}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-4 text-sm text-muted-foreground">
                No {productCategoryLabels[category].toLowerCase()} selected.
              </p>
            )}
          </section>

          <section className="border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <h2 className="font-semibold">Estimated Cost</h2>
            </div>
            <dl className="p-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Equipment</dt>
                <dd className="font-medium">{formatCurrency(estimatedCost)}</dd>
              </div>
            </dl>
          </section>

          <section className="border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <h2 className="font-semibold">Filters</h2>
            </div>
            <div className="space-y-3 p-4 text-sm">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={matchTankSize}
                  disabled={tankSizeGallons == null}
                  onChange={(event) => setMatchTankSize(event.target.checked)}
                  className="mt-0.5 size-4"
                />
                <span>
                  Match current tank
                  <span className="block text-xs text-muted-foreground">
                    {tankSizeGallons
                      ? `${tankSizeGallons} gal selected`
                      : "Choose a tank first"}
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={matchPlantedSetup}
                  disabled={!plantedSetup}
                  onChange={(event) =>
                    setMatchPlantedSetup(event.target.checked)
                  }
                  className="mt-0.5 size-4"
                />
                <span>
                  Match planted setup
                  <span className="block text-xs text-muted-foreground">
                    {plantedSetup ? "Planted build detected" : "No planted setup"}
                  </span>
                </span>
              </label>

              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href={`/products?category=${category}`}>Open Catalog</Link>
              </Button>
            </div>
          </section>
        </aside>

        <div className="min-w-0">
          <div className="mb-3 flex flex-col gap-1 border-b border-border pb-3">
            <h2 className="text-xl font-bold">
              {visibleProducts.length} {productCategoryLabels[category]}
            </h2>
            <p className="text-sm text-muted-foreground">
              Products are filtered by the current builder setup when filters
              are enabled, then sorted by fit, rating, and price.
            </p>
          </div>

          {visibleProducts.length === 0 ? (
            <div className="border border-border bg-card p-6 text-sm text-muted-foreground">
              No active products match the current builder filters.
            </div>
          ) : (
            <div className="overflow-x-auto border border-border bg-card">
              <table className="w-full min-w-[860px] table-fixed border-collapse text-sm">
                <thead className="bg-muted text-left text-xs">
                  <tr>
                    <th
                      scope="col"
                      className="w-[33%] px-2 py-2 font-semibold"
                    >
                      Product
                    </th>
                    <th
                      scope="col"
                      className="w-[13%] px-2 py-2 font-semibold"
                    >
                      Brand
                    </th>
                    <th
                      scope="col"
                      className="w-[15%] px-2 py-2 font-semibold"
                    >
                      Specs
                    </th>
                    <th
                      scope="col"
                      className="w-[12%] px-2 py-2 font-semibold"
                    >
                      Tank
                    </th>
                    <th
                      scope="col"
                      className="w-[10%] px-2 py-2 font-semibold"
                    >
                      Rating
                    </th>
                    <th
                      scope="col"
                      className="w-[8%] px-2 py-2 font-semibold"
                    >
                      Price
                    </th>
                    <th
                      scope="col"
                      className="w-[9%] py-2 pl-2 pr-3 text-right font-semibold"
                    >
                      Add
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleProducts.map((product) => (
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
                              {product.model ?? product.slug}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-2 align-top">{product.brand}</td>
                      <td className="px-2 py-2 align-top text-muted-foreground">
                        {getCategorySpec(product)}
                      </td>
                      <td className="px-2 py-2 align-top">
                        {getProductTankRange(product)}
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
          )}
        </div>
      </div>
    </section>
  );
}

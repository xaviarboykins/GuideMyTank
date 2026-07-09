"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { ProductThumbnail } from "@/components/products/product-thumbnail";
import { Button } from "@/components/ui/button";
import type { AquariumEquipmentProduct } from "@/lib/aquarium-builder/types";
import {
  AQUARIUM_BUILDER_STORAGE_KEY,
  defaultAquariumBuild,
  parseAquariumBuild,
} from "@/lib/aquarium-builder/storage";
import { mapProductCategoryToEquipmentCategory } from "@/lib/products/builder";
import { productCategoryLabels } from "@/lib/products/types";
import type { ProductCategory } from "@/lib/products/types";

type BuilderProductSidebarProps = {
  category: ProductCategory;
  productCount: number;
};

function getSavedBuild() {
  return parseAquariumBuild(
    window.localStorage.getItem(AQUARIUM_BUILDER_STORAGE_KEY),
  );
}

function getEquipmentTotal(equipment: AquariumEquipmentProduct[]) {
  return equipment.reduce((total, item) => {
    return total + item.estimatedPrice * item.quantity;
  }, 0);
}

function formatCurrency(value: number) {
  return `$${Math.round(value)}`;
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

export function BuilderProductSidebar({
  category,
  productCount,
}: BuilderProductSidebarProps) {
  const [build, setBuild] = useState(defaultAquariumBuild);
  const equipmentCategory = mapProductCategoryToEquipmentCategory(category);
  const selectedEquipment = useMemo(() => {
    return build.equipment.filter((item) => {
      return item.category === equipmentCategory;
    });
  }, [build.equipment, equipmentCategory]);
  const estimatedCost = getEquipmentTotal(build.equipment);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setBuild(getSavedBuild());
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <aside className="min-w-0 space-y-5">
      <section className="border border-border bg-card p-4">
        <div className="text-center text-sm font-bold">Equipment List</div>

        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs font-bold uppercase">Products</dt>
            <dd className="text-lg font-bold text-sky-700">{productCount}</dd>
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
              <li key={`${item.category}-${item.productId ?? item.name}`} className="p-3">
                <div className="flex items-center gap-3">
                  <ProductThumbnail
                    alt={item.name}
                    category={getProductCategoryForEquipment(item)}
                    imageUrl={item.imageUrl}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">{item.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Qty {item.quantity} | {formatCurrency(item.estimatedPrice)}
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
        <div className="space-y-3 p-4 text-sm text-muted-foreground">
          <p>Builder filters will use tank size and selected setup data.</p>
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href={`/products?category=${category}`}>Open Catalog</Link>
          </Button>
        </div>
      </section>
    </aside>
  );
}

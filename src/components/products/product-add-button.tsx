"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import type {
  AquariumBuild,
  AquariumEquipmentProductSelections,
  AquariumEquipmentProduct,
} from "@/lib/aquarium-builder/types";
import {
  AQUARIUM_BUILDER_STORAGE_KEY,
  defaultAquariumBuild,
  parseAquariumBuild,
  serializeAquariumBuild,
} from "@/lib/aquarium-builder/storage";
import {
  getProductKeySpecs,
  mapProductCategoryToEquipmentCategory,
  singleChoiceEquipmentCategories,
} from "@/lib/products/builder";
import type { Product } from "@/lib/products/types";

type ProductAddButtonProps = {
  product: Pick<
    Product,
    | "id"
    | "title"
    | "category"
    | "image_url"
    | "price_estimate"
    | "recommended_tank_min_gallons"
    | "recommended_tank_max_gallons"
    | "flow_rate_gph"
    | "heater_watts"
    | "dimensions"
    | "light_type"
    | "light_output"
    | "planted_tank"
    | "substrate_type"
  >;
};

function getTankGallons(product: ProductAddButtonProps["product"]) {
  const min = product.recommended_tank_min_gallons;
  const max = product.recommended_tank_max_gallons;

  if (min != null && max != null && min === max) {
    return min;
  }

  return null;
}

function upsertEquipmentProduct(
  build: AquariumBuild,
  equipmentProduct: AquariumEquipmentProduct,
) {
  if (singleChoiceEquipmentCategories.includes(equipmentProduct.category)) {
    return [
      ...build.equipment.filter(
        (item) => item.category !== equipmentProduct.category,
      ),
      equipmentProduct,
    ];
  }

  const existingProduct = build.equipment.find((item) => {
    return item.productId === equipmentProduct.productId;
  });

  if (!existingProduct) {
    return [...build.equipment, equipmentProduct];
  }

  return build.equipment.map((item) => {
    if (item.productId !== equipmentProduct.productId) {
      return item;
    }

    return {
      ...item,
      quantity: item.quantity + 1,
    };
  });
}

function upsertEquipmentProductSelections(
  selections: AquariumEquipmentProductSelections | undefined,
  equipmentCategory: AquariumEquipmentProduct["category"],
  productId: string,
): AquariumEquipmentProductSelections {
  if (equipmentCategory === "tank") {
    return { ...selections, tankProductId: productId };
  }

  if (equipmentCategory === "filter") {
    return { ...selections, filterProductId: productId };
  }

  if (equipmentCategory === "heater") {
    return { ...selections, heaterProductId: productId };
  }

  if (equipmentCategory === "lighting") {
    return { ...selections, lightingProductId: productId };
  }

  if (equipmentCategory === "substrate") {
    return { ...selections, substrateProductId: productId };
  }

  if (equipmentCategory === "hardscape") {
    return {
      ...selections,
      decorProductIds: Array.from(
        new Set([...(selections?.decorProductIds ?? []), productId]),
      ),
    };
  }

  return selections ?? {};
}

export function ProductAddButton({ product }: ProductAddButtonProps) {
  const router = useRouter();
  const equipmentCategory = mapProductCategoryToEquipmentCategory(
    product.category,
  );

  function addProductToBuilder() {
    const build =
      typeof window === "undefined"
        ? defaultAquariumBuild
        : parseAquariumBuild(
            window.localStorage.getItem(AQUARIUM_BUILDER_STORAGE_KEY),
          );
    const equipmentProduct: AquariumEquipmentProduct = {
      productId: product.id,
      name: product.title,
      category: equipmentCategory,
      quantity: 1,
      estimatedPrice: product.price_estimate ?? 0,
      flowRateGph: product.flow_rate_gph,
      imageUrl: product.image_url,
      productUrl: null,
      notes: getProductKeySpecs(product) || null,
    };
    const tankGallons =
      equipmentCategory === "tank" ? getTankGallons(product) : null;
    const nextBuild: AquariumBuild = {
      ...build,
      tank: {
        ...build.tank,
        sizeGallons: tankGallons ?? build.tank.sizeGallons,
      },
      equipment: upsertEquipmentProduct(build, equipmentProduct),
      equipmentProductIds: upsertEquipmentProductSelections(
        build.equipmentProductIds,
        equipmentCategory,
        product.id,
      ),
      updatedAt: new Date().toISOString(),
    };

    window.localStorage.setItem(
      AQUARIUM_BUILDER_STORAGE_KEY,
      serializeAquariumBuild(nextBuild),
    );
    router.push("/aquarium-builder");
  }

  return (
    <Button type="button" size="sm" onClick={addProductToBuilder}>
      Add
    </Button>
  );
}

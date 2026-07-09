import type { AquariumEquipmentCategory } from "@/lib/aquarium-builder/types";
import type { Product, ProductCategory } from "@/lib/products/types";

type ProductSpecs = Pick<
  Product,
  | "dimensions"
  | "flow_rate_gph"
  | "heater_watts"
  | "light_type"
  | "light_output"
  | "substrate_type"
  | "planted_tank"
>;

export const singleChoiceEquipmentCategories: AquariumEquipmentCategory[] = [
  "tank",
  "filter",
  "heater",
  "lighting",
];

export function mapProductCategoryToEquipmentCategory(
  category: ProductCategory,
): AquariumEquipmentCategory {
  if (category === "tanks") {
    return "tank";
  }

  if (category === "filters") {
    return "filter";
  }

  if (category === "heaters") {
    return "heater";
  }

  if (category === "decor") {
    return "hardscape";
  }

  return category;
}

export function getProductTankRange(product: Product) {
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

export function getProductKeySpecs(product: ProductSpecs) {
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

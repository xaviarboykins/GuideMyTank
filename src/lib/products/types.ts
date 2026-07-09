export const productCategories = [
  "tanks",
  "filters",
  "heaters",
  "lighting",
  "substrate",
  "decor",
] as const;

export type ProductCategory = (typeof productCategories)[number];

export const productCategoryLabels: Record<ProductCategory, string> = {
  tanks: "Tanks",
  filters: "Filters",
  heaters: "Heaters",
  lighting: "Lighting",
  substrate: "Substrate",
  decor: "Decor",
};

export const futureProductCategories = [
  "air-pumps",
  "co2",
  "maintenance",
  "test-kits",
  "water-treatment",
  "food",
] as const;

export type FutureProductCategory = (typeof futureProductCategories)[number];

export type ProductDifficulty = "beginner" | "intermediate" | "advanced";

export type Product = {
  id: string;
  slug: string;
  category: ProductCategory;
  brand: string;
  model: string | null;
  title: string;
  description: string | null;
  short_description: string | null;
  image_url: string | null;
  recommended_tank_min_gallons: number | null;
  recommended_tank_max_gallons: number | null;
  freshwater: boolean;
  saltwater: boolean;
  planted_tank: boolean;
  flow_rate_gph: number | null;
  heater_watts: number | null;
  light_type: string | null;
  light_output: string | null;
  substrate_type: string | null;
  dimensions: string | null;
  price_estimate: number | null;
  guide_rating: number | null;
  difficulty: ProductDifficulty | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ProductInsert = Omit<
  Product,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type ProductUpdate = Partial<ProductInsert>;

export type ProductSearchFilters = {
  query?: string;
  category?: ProductCategory;
  tankSizeGallons?: number;
  freshwater?: boolean;
  saltwater?: boolean;
  plantedTank?: boolean;
  activeOnly?: boolean;
};

export type BuilderProductFilters = ProductSearchFilters & {
  category: ProductCategory;
};

export function isProductCategory(value: string): value is ProductCategory {
  return productCategories.includes(value as ProductCategory);
}

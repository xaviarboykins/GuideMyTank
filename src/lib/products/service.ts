import { createStaticClient } from "@/lib/supabase/static";
import type {
  BuilderProductFilters,
  Product,
  ProductCategory,
  ProductSearchFilters,
} from "@/lib/products/types";

const PRODUCTS_SELECT = "*";

function escapePostgrestSearchValue(value: string) {
  return value.replace(/[%_,().]/g, " ").replace(/\s+/g, " ").trim();
}

function shouldFilterActiveProducts(activeOnly: boolean | undefined) {
  return activeOnly !== false;
}

function isPositiveNumber(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export async function getProductBySlug(slug: string) {
  const supabase = createStaticClient();
  const trimmedSlug = slug.trim();

  if (!trimmedSlug) {
    return null;
  }

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCTS_SELECT)
    .eq("slug", trimmedSlug)
    .eq("is_active", true)
    .single();

  if (error) {
    return null;
  }

  return data as Product;
}

export async function getProductById(id: string) {
  const supabase = createStaticClient();
  const trimmedId = id.trim();

  if (!trimmedId) {
    return null;
  }

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCTS_SELECT)
    .eq("id", trimmedId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch product: ${error.message}`);
  }

  return (data as Product | null) ?? null;
}

export async function getProductsByCategory(category: ProductCategory) {
  return searchProducts({ category });
}

export async function searchProducts(filters: ProductSearchFilters = {}) {
  const supabase = createStaticClient();

  let query = supabase
    .from("products")
    .select(PRODUCTS_SELECT)
    .order("category", { ascending: true })
    .order("brand", { ascending: true })
    .order("title", { ascending: true });

  if (shouldFilterActiveProducts(filters.activeOnly)) {
    query = query.eq("is_active", true);
  }

  if (filters.query) {
    const searchValue = escapePostgrestSearchValue(filters.query);

    if (searchValue) {
      query = query.or(
        `title.ilike.%${searchValue}%,model.ilike.%${searchValue}%,brand.ilike.%${searchValue}%`,
      );
    }
  }

  if (filters.category) {
    query = query.eq("category", filters.category);
  }

  if (isPositiveNumber(filters.tankSizeGallons)) {
    query = query
      .or(
        `recommended_tank_min_gallons.is.null,recommended_tank_min_gallons.lte.${filters.tankSizeGallons}`,
      )
      .or(
        `recommended_tank_max_gallons.is.null,recommended_tank_max_gallons.gte.${filters.tankSizeGallons}`,
      );
  }

  if (typeof filters.freshwater === "boolean") {
    query = query.eq("freshwater", filters.freshwater);
  }

  if (typeof filters.saltwater === "boolean") {
    query = query.eq("saltwater", filters.saltwater);
  }

  if (typeof filters.plantedTank === "boolean") {
    query = query.eq("planted_tank", filters.plantedTank);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch products: ${error.message}`);
  }

  return data as Product[];
}

export async function getBuilderProducts(filters: BuilderProductFilters) {
  return searchProducts({
    ...filters,
    freshwater: true,
    activeOnly: true,
  });
}

export async function getProductsForTankSize(
  category: ProductCategory,
  gallons: number,
) {
  return searchProducts({
    category,
    tankSizeGallons: gallons,
  });
}

import { createStaticClient } from "@/lib/supabase/static";

const SPECIES_SELECT = `
  *,
  water_parameters (*),
  stocking_profiles (*)
`;

const BEGINNER_CARE_LEVELS = ["Beginner", "Easy"];
const FRESHWATER_TYPES = ["freshwater", "fresh"];

export type PisciDexFilters = {
  query?: string;
  tankSizeGallons?: number;
  temperament?: string;
  difficulty?: string;
  waterType?: string;
  beginnerFriendly?: boolean;
};

export type PisciDexFilterSearchParams = Record<
  string,
  string | string[] | undefined
>;

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

function escapePostgrestSearchValue(value: string) {
  return value.replace(/[%_,().]/g, " ").replace(/\s+/g, " ").trim();
}

export function parsePisciDexFilters(
  searchParams: PisciDexFilterSearchParams,
): PisciDexFilters {
  return {
    query: parseTextFilter(searchParams.q),
    tankSizeGallons: parseNumberFilter(searchParams.tank),
    temperament: parseTextFilter(searchParams.temperament),
    difficulty: parseTextFilter(searchParams.difficulty),
    waterType: parseTextFilter(searchParams.waterType),
    beginnerFriendly: parseBooleanFilter(searchParams.beginner),
  };
}

export async function getAllSpecies() {
  const supabase = createStaticClient();

  const { data, error } = await supabase
    .from("species")
    .select(SPECIES_SELECT)
    .order("common_name", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch species: ${error.message}`);
  }

  return data;
}

export async function getFilteredSpecies(filters: PisciDexFilters) {
  const supabase = createStaticClient();

  if (
    filters.waterType &&
    !FRESHWATER_TYPES.includes(filters.waterType.toLowerCase())
  ) {
    return [];
  }

  let query = supabase
    .from("species")
    .select(SPECIES_SELECT)
    .order("common_name", { ascending: true });

  if (filters.query) {
    const searchValue = escapePostgrestSearchValue(filters.query);

    if (searchValue) {
      query = query.or(
        `common_name.ilike.%${searchValue}%,scientific_name.ilike.%${searchValue}%,family.ilike.%${searchValue}%`,
      );
    }
  }

  if (filters.tankSizeGallons) {
    query = query.lte("min_tank_gallons", filters.tankSizeGallons);
  }

  if (filters.temperament) {
    query = query.eq("temperament", filters.temperament);
  }

  if (filters.difficulty) {
    query = query.eq("care_level", filters.difficulty);
  }

  if (filters.beginnerFriendly) {
    query = query.in("care_level", BEGINNER_CARE_LEVELS);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch filtered species: ${error.message}`);
  }

  return data;
}

export async function getSpeciesBySlug(slug: string) {
  const supabase = createStaticClient();

  const { data, error } = await supabase
    .from("species")
    .select(SPECIES_SELECT)
    .eq("slug", slug)
    .single();

  if (error) {
    return null;
  }

  return data;
}

export async function getSpeciesSlugs() {
  const supabase = createStaticClient();

  const { data, error } = await supabase.from("species").select("slug");

  if (error) {
    throw new Error(`Failed to fetch species slugs: ${error.message}`);
  }

  return data;
}

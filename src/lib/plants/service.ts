import { createStaticClient } from "../supabase/static";
import { mapPlantDatabaseRow } from "./mapper";
import type { Plant, PlantDatabaseRow } from "./types";

const PLANTS_SELECT = "*";

export function normalizePlantSearchQuery(query: string) {
  return query.replace(/[%_,().]/g, " ").replace(/\s+/g, " ").trim();
}

export function buildPlantSearchFilter(query: string) {
  const searchValue = normalizePlantSearchQuery(query);

  return searchValue
    ? `common_name.ilike.%${searchValue}%,scientific_name.ilike.%${searchValue}%`
    : null;
}

function mapPlantRows(rows: PlantDatabaseRow[] | null): Plant[] {
  return (rows ?? []).map(mapPlantDatabaseRow);
}

export async function getPlants(): Promise<Plant[]> {
  return searchPlants();
}

export async function searchPlants(query = ""): Promise<Plant[]> {
  const supabase = createStaticClient();
  let request = supabase
    .from("plants")
    .select(PLANTS_SELECT)
    .eq("is_active", true);
  const searchFilter = buildPlantSearchFilter(query);

  if (searchFilter) {
    request = request.or(searchFilter);
  }

  const { data, error } = await request
    .order("common_name", { ascending: true })
    .order("scientific_name", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch plants: ${error.message}`);
  }

  return mapPlantRows(data);
}

export async function getPlantById(id: string): Promise<Plant | null> {
  const trimmedId = id.trim();

  if (!trimmedId) {
    return null;
  }

  const supabase = createStaticClient();
  const { data, error } = await supabase
    .from("plants")
    .select(PLANTS_SELECT)
    .eq("id", trimmedId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch plant: ${error.message}`);
  }

  return data ? mapPlantDatabaseRow(data) : null;
}

export async function getPlantsByIds(ids: string[]): Promise<Plant[]> {
  const uniqueIds = Array.from(
    new Set(ids.map((id) => id.trim()).filter(Boolean)),
  );

  if (uniqueIds.length === 0) {
    return [];
  }

  const supabase = createStaticClient();
  const { data, error } = await supabase
    .from("plants")
    .select(PLANTS_SELECT)
    .in("id", uniqueIds)
    .eq("is_active", true)
    .order("common_name", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch selected plants: ${error.message}`);
  }

  return mapPlantRows(data);
}

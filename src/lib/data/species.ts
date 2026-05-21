import { createStaticClient } from "@/lib/supabase/static";

export async function getAllSpecies() {
  const supabase = createStaticClient();

  const { data, error } = await supabase
    .from("species")
    .select(
      `
  *,
  water_parameters (*),
  stocking_profiles (*)
`,
    )
    .order("common_name", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch species: ${error.message}`);
  }

  return data;
}

export async function getSpeciesBySlug(slug: string) {
  const supabase = createStaticClient();

  const { data, error } = await supabase
    .from("species")
    .select(
      `
  *,
  water_parameters (*),
  stocking_profiles (*)
`,
    )
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

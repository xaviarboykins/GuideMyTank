import {
  calculateCompatibility,
  toCompatibilitySpecies,
} from "./engine";
import type {
  CompatibilityResult,
  SpeciesCompatibilityGroup,
} from "@/lib/compatibility/types";
import { createStaticClient } from "../supabase/static";

export async function getCompatibility(
  speciesASlug: string,
  speciesBSlug: string,
): Promise<CompatibilityResult | null> {
  const supabase = createStaticClient();

  const { data: species, error: speciesError } = await supabase
    .from("species")
    .select("*")
    .in("slug", [speciesASlug, speciesBSlug]);

  if (speciesError) {
    throw new Error(`Failed to fetch species: ${speciesError.message}`);
  }

  if (!species || species.length !== 2) {
    return null;
  }

  const speciesA = species.find((item) => item.slug === speciesASlug);
  const speciesB = species.find((item) => item.slug === speciesBSlug);

  if (!speciesA || !speciesB) {
    return null;
  }

  return calculateCompatibility(speciesA, speciesB);
}

export async function getCompatibilityRule(
  speciesASlug: string,
  speciesBSlug: string,
): Promise<CompatibilityResult | null> {
  return getCompatibility(speciesASlug, speciesBSlug);
}

export async function getCompatibilityRulesForSpecies(
  speciesSlug: string,
): Promise<SpeciesCompatibilityGroup> {
  const data = await getSpeciesCompatibilityData(speciesSlug);

  return data.compatibility;
}

export async function getSpeciesCompatibilityData(speciesSlug: string) {
  const supabase = createStaticClient();
  const emptyCompatibility: SpeciesCompatibilityGroup = {
    compatible: [],
    caution: [],
    incompatible: [],
  };

  const { data: species, error: speciesError } = await supabase
    .from("species")
    .select("*")
    .order("common_name", { ascending: true });

  if (speciesError || !species) {
    return {
      compatibility: emptyCompatibility,
      candidates: [],
    };
  }

  const currentSpecies = species.find((item) => item.slug === speciesSlug);

  if (!currentSpecies) {
    return {
      compatibility: emptyCompatibility,
      candidates: [],
    };
  }

  const grouped: SpeciesCompatibilityGroup = {
    compatible: [],
    caution: [],
    incompatible: [],
  };

  for (const relatedSpecies of species) {
    if (relatedSpecies.id === currentSpecies.id) {
      continue;
    }

    const result = calculateCompatibility(currentSpecies, relatedSpecies);

    if (result.compatibility === "compatible") {
      grouped.compatible.push(result);
    }

    if (result.compatibility === "caution") {
      grouped.caution.push(result);
    }

    if (result.compatibility === "incompatible") {
      grouped.incompatible.push(result);
    }
  }

  return {
    compatibility: grouped,
    candidates: species.filter((item) => item.id !== currentSpecies.id),
  };
}

export async function getCompatibleSpeciesPairs() {
  const supabase = createStaticClient();

  const speciesResult = await supabase
    .from("species")
    .select("*")
    .order("common_name", { ascending: true });

  if (speciesResult.error) {
    throw new Error(
      `Failed to fetch species for compatibility: ${speciesResult.error.message}`,
    );
  }
  const species = speciesResult.data;

  return species.map((speciesA) => ({
    species: toCompatibilitySpecies(speciesA),
    compatibleSpecies: species
      .filter((speciesB) => speciesB.id !== speciesA.id)
      .map((speciesB) => calculateCompatibility(speciesA, speciesB))
      .filter((result) => result.compatibility === "compatible")
      .map((result) => result.species_b),
  }));
}

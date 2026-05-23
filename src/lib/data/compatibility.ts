import { createStaticClient } from "@/lib/supabase/static";

export type CompatibilitySpecies = {
  slug: string;
  common_name: string;
};

export type CompatibilityResult = {
  compatibility: "compatible" | "caution" | "incompatible" | null;
  confidence: number | null;
  notes: string | null;
  species_a: CompatibilitySpecies;
  species_b: CompatibilitySpecies;
};

export type SpeciesCompatibilityGroup = {
  compatible: CompatibilityResult[];
  caution: CompatibilityResult[];
  incompatible: CompatibilityResult[];
};

export async function getCompatibilityRule(
  speciesASlug: string,
  speciesBSlug: string,
): Promise<CompatibilityResult | null> {
  const supabase = createStaticClient();

  const { data: species, error: speciesError } = await supabase
    .from("species")
    .select("id, slug, common_name")
    .in("slug", [speciesASlug, speciesBSlug]);

  if (speciesError || !species || species.length !== 2) {
    return null;
  }

  const speciesA = species.find((item) => item.slug === speciesASlug);
  const speciesB = species.find((item) => item.slug === speciesBSlug);

  if (!speciesA || !speciesB) {
    return null;
  }

  const { data: rule, error } = await supabase
    .from("compatibility_rules")
    .select("compatibility, confidence, notes, species_a_id, species_b_id")
    .or(
      `and(species_a_id.eq.${speciesA.id},species_b_id.eq.${speciesB.id}),and(species_a_id.eq.${speciesB.id},species_b_id.eq.${speciesA.id})`,
    )
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch compatibility rule: ${error.message}`);
  }

  if (!rule) {
    return null;
  }

  return {
    compatibility: rule.compatibility as CompatibilityResult["compatibility"],
    confidence: rule.confidence,
    notes: rule.notes,
    species_a: {
      slug: speciesA.slug,
      common_name: speciesA.common_name,
    },
    species_b: {
      slug: speciesB.slug,
      common_name: speciesB.common_name,
    },
  };
}

export async function getCompatibilityRulesForSpecies(
  speciesSlug: string,
): Promise<SpeciesCompatibilityGroup> {
  const supabase = createStaticClient();

  const { data: species, error: speciesError } = await supabase
    .from("species")
    .select("id, slug, common_name")
    .eq("slug", speciesSlug)
    .maybeSingle();

  if (speciesError || !species) {
    return {
      compatible: [],
      caution: [],
      incompatible: [],
    };
  }

  const { data: rules, error } = await supabase
    .from("compatibility_rules")
    .select(
      `
      compatibility,
      confidence,
      notes,
      species_a:species_a_id (
        slug,
        common_name
      ),
      species_b:species_b_id (
        slug,
        common_name
      )
    `,
    )
    .or(`species_a_id.eq.${species.id},species_b_id.eq.${species.id}`);

  if (error || !rules) {
    return {
      compatible: [],
      caution: [],
      incompatible: [],
    };
  }

  const grouped: SpeciesCompatibilityGroup = {
    compatible: [],
    caution: [],
    incompatible: [],
  };

  for (const rule of rules) {
    const speciesA = Array.isArray(rule.species_a)
      ? rule.species_a[0]
      : rule.species_a;

    const speciesB = Array.isArray(rule.species_b)
      ? rule.species_b[0]
      : rule.species_b;

    if (!speciesA || !speciesB) {
      continue;
    }

    const result: CompatibilityResult = {
      compatibility: rule.compatibility as CompatibilityResult["compatibility"],
      confidence: rule.confidence,
      notes: rule.notes,
      species_a: {
        slug: speciesA.slug,
        common_name: speciesA.common_name,
      },
      species_b: {
        slug: speciesB.slug,
        common_name: speciesB.common_name,
      },
    };

    if (rule.compatibility === "compatible") {
      grouped.compatible.push(result);
    }

    if (rule.compatibility === "caution") {
      grouped.caution.push(result);
    }

    if (rule.compatibility === "incompatible") {
      grouped.incompatible.push(result);
    }
  }

  return grouped;
}

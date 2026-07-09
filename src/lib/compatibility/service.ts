import {
  calculateCompatibility,
  determineStatus,
  legacyCompatibilityToScore,
  toCompatibilitySpecies,
} from "@/lib/compatibility/engine";
import type {
  CompatibilityResult,
  SpeciesCompatibilityGroup,
  SpeciesRow,
} from "@/lib/compatibility/types";
import { createStaticClient } from "@/lib/supabase/static";

type WaterParametersRow = {
  species_id: string;
  min_temp_f: number | null;
  max_temp_f: number | null;
  min_ph: number | null;
  max_ph: number | null;
  min_hardness_dgh: number | null;
  max_hardness_dgh: number | null;
};

function applyWaterParameters(
  species: SpeciesRow,
  waterParameters: WaterParametersRow | undefined,
): SpeciesRow {
  if (!waterParameters) {
    return species;
  }

  return {
    ...species,
    min_temp_f: waterParameters.min_temp_f ?? species.min_temp_f,
    max_temp_f: waterParameters.max_temp_f ?? species.max_temp_f,
    min_ph: waterParameters.min_ph ?? species.min_ph,
    max_ph: waterParameters.max_ph ?? species.max_ph,
  };
}

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

  const speciesIds = [speciesA.id, speciesB.id];

  const { data: waterParameters, error: waterParametersError } = await supabase
    .from("water_parameters")
    .select(
      "species_id, min_temp_f, max_temp_f, min_ph, max_ph, min_hardness_dgh, max_hardness_dgh",
    )
    .in("species_id", speciesIds)
    .returns<WaterParametersRow[]>();

  if (waterParametersError) {
    throw new Error(
      `Failed to fetch water parameters: ${waterParametersError.message}`,
    );
  }

  const waterParametersBySpeciesId = new Map(
    (waterParameters ?? []).map((row) => [row.species_id, row]),
  );

  const speciesAWithWaterParameters = applyWaterParameters(
    speciesA,
    waterParametersBySpeciesId.get(speciesA.id),
  );

  const speciesBWithWaterParameters = applyWaterParameters(
    speciesB,
    waterParametersBySpeciesId.get(speciesB.id),
  );

  const { data: rule, error: ruleError } = await supabase
    .from("compatibility_rules")
    .select(
      "compatibility, confidence, expert_validated, notes, species_a_id, species_b_id",
    )
    .or(
      `and(species_a_id.eq.${speciesA.id},species_b_id.eq.${speciesB.id}),and(species_a_id.eq.${speciesB.id},species_b_id.eq.${speciesA.id})`,
    )
    .maybeSingle();

  if (ruleError) {
    throw new Error(`Failed to fetch compatibility rule: ${ruleError.message}`);
  }

  if (!rule) {
    return calculateCompatibility(
      speciesAWithWaterParameters,
      speciesBWithWaterParameters,
    );
  }

  const compatibility =
    rule.compatibility as CompatibilityResult["compatibility"];

  const score = legacyCompatibilityToScore(compatibility);

  return {
    score,
    status: determineStatus(score),
    reasons: rule.notes ? [rule.notes] : ["Manual compatibility rule found."],
    compatibility,
    confidence: rule.confidence,
    notes: rule.notes,
    expertValidated: rule.expert_validated ?? true,
    species_a: toCompatibilitySpecies(speciesA),
    species_b: toCompatibilitySpecies(speciesB),
  };
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
  const supabase = createStaticClient();

  const { data: species, error: speciesError } = await supabase
    .from("species")
    .select("*")
    .order("common_name", { ascending: true });

  if (speciesError || !species) {
    return {
      compatible: [],
      caution: [],
      incompatible: [],
    };
  }

  const currentSpecies = species.find((item) => item.slug === speciesSlug);

  if (!currentSpecies) {
    return {
      compatible: [],
      caution: [],
      incompatible: [],
    };
  }

  const speciesIds = species.map((item) => item.id);

  const { data: waterParameters, error: waterParametersError } = await supabase
    .from("water_parameters")
    .select(
      "species_id, min_temp_f, max_temp_f, min_ph, max_ph, min_hardness_dgh, max_hardness_dgh",
    )
    .in("species_id", speciesIds)
    .returns<WaterParametersRow[]>();

  if (waterParametersError) {
    throw new Error(
      `Failed to fetch water parameters: ${waterParametersError.message}`,
    );
  }

  const waterParametersBySpeciesId = new Map(
    (waterParameters ?? []).map((row) => [row.species_id, row]),
  );

  const speciesWithWaterParameters = species.map((item) =>
    applyWaterParameters(item, waterParametersBySpeciesId.get(item.id)),
  );

  const currentSpeciesWithWaterParameters = speciesWithWaterParameters.find(
    (item) => item.slug === speciesSlug,
  );

  if (!currentSpeciesWithWaterParameters) {
    return {
      compatible: [],
      caution: [],
      incompatible: [],
    };
  }

  const { data: rules, error: rulesError } = await supabase
    .from("compatibility_rules")
    .select(
      "compatibility, confidence, expert_validated, notes, species_a_id, species_b_id",
    )
    .or(
      `species_a_id.eq.${currentSpecies.id},species_b_id.eq.${currentSpecies.id}`,
    );

  if (rulesError) {
    throw new Error(
      `Failed to fetch compatibility rules: ${rulesError.message}`,
    );
  }

  const manualRulesBySpeciesId = new Map(
    (rules ?? []).map((rule) => {
      const relatedSpeciesId =
        rule.species_a_id === currentSpecies.id
          ? rule.species_b_id
          : rule.species_a_id;

      return [relatedSpeciesId, rule];
    }),
  );

  const grouped: SpeciesCompatibilityGroup = {
    compatible: [],
    caution: [],
    incompatible: [],
  };

  for (const relatedSpecies of speciesWithWaterParameters) {
    if (relatedSpecies.id === currentSpecies.id) {
      continue;
    }

    const manualRule = manualRulesBySpeciesId.get(relatedSpecies.id);

    const computedResult = calculateCompatibility(
      currentSpeciesWithWaterParameters,
      relatedSpecies,
    );

    const result: CompatibilityResult = manualRule
      ? {
          score: legacyCompatibilityToScore(
            manualRule.compatibility as CompatibilityResult["compatibility"],
          ),
          status: determineStatus(
            legacyCompatibilityToScore(
              manualRule.compatibility as CompatibilityResult["compatibility"],
            ),
          ),
          reasons: manualRule.notes
            ? [manualRule.notes]
            : ["Manual compatibility rule found."],
          compatibility:
            manualRule.compatibility as CompatibilityResult["compatibility"],
          confidence: manualRule.confidence,
          notes: manualRule.notes,
          expertValidated: manualRule.expert_validated ?? true,
          species_a: toCompatibilitySpecies(currentSpecies),
          species_b: toCompatibilitySpecies(relatedSpecies),
        }
      : computedResult;

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

  return grouped;
}

export async function getCompatibleSpeciesPairs() {
  const supabase = createStaticClient();

  const { data: species, error } = await supabase
    .from("species")
    .select("*")
    .order("common_name", { ascending: true });

  if (error) {
    throw new Error(
      `Failed to fetch species for compatibility: ${error.message}`,
    );
  }

  return species.map((speciesA) => ({
    species: toCompatibilitySpecies(speciesA),
    compatibleSpecies: species
      .filter((speciesB) => speciesB.id !== speciesA.id)
      .map((speciesB) => calculateCompatibility(speciesA, speciesB))
      .filter((result) => result.compatibility === "compatible")
      .map((result) => result.species_b),
  }));
}

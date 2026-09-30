import {
  calculateCompatibilityDiagnostics,
  toCompatibilitySpecies,
} from "./engine";
import { buildCompatibilityPairAnalysis } from "./analysis";
import {
  applyCompatibilityOverride,
  createCompatibilityOverrideMap,
  getCompatibilityPairKey,
} from "./overrides";
import {
  getCompatibilityIndexability,
  hasSpeciesSourceCoverage,
  isReviewedCompatibilityResult,
} from "./indexability";
import type { CompatibilityPair } from "./urls";
import type {
  CompatibilityReport,
  CompatibilityResult,
  SpeciesRow,
  SpeciesCompatibilityGroup,
} from "@/lib/compatibility/types";
import { createStaticClient } from "../supabase/static";

type StaticClient = ReturnType<typeof createStaticClient>;

async function getExpertCompatibilityOverrides(
  supabase: StaticClient,
  speciesId?: string,
) {
  let query = supabase
    .from("compatibility_rules")
    .select("*")
    .eq("expert_validated", true)
    .order("created_at", { ascending: false });

  if (speciesId) {
    query = query.or(
      `species_a_id.eq.${speciesId},species_b_id.eq.${speciesId}`,
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch compatibility overrides: ${error.message}`);
  }

  return createCompatibilityOverrideMap(data ?? []);
}

function createCompatibilityReport(
  speciesA: SpeciesRow,
  speciesB: SpeciesRow,
  overrides: Awaited<ReturnType<typeof getExpertCompatibilityOverrides>>,
): CompatibilityReport {
  const diagnostics = calculateCompatibilityDiagnostics(speciesA, speciesB);
  const override = overrides.get(
    getCompatibilityPairKey(speciesA.id, speciesB.id),
  );

  const report = applyCompatibilityOverride(diagnostics, override);
  return {
    ...report,
    analysis: buildCompatibilityPairAnalysis(
      speciesA,
      speciesB,
      report.result,
      report.findings,
    ),
  };
}

export async function getCompatibilityReport(
  speciesASlug: string,
  speciesBSlug: string,
): Promise<CompatibilityReport | null> {
  if (speciesASlug === speciesBSlug) {
    return null;
  }

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

  const overrides = await getExpertCompatibilityOverrides(supabase, speciesA.id);
  const report = createCompatibilityReport(speciesA, speciesB, overrides);
  const { data: sources, error: sourceError } = await supabase
    .from("species_source_references")
    .select("id,species_id,source_label,source_url,source_category,confidence,updated_at")
    .in("species_id", [speciesA.id, speciesB.id])
    .order("source_category")
    .order("source_url");

  if (sourceError) {
    throw new Error(`Failed to fetch compatibility sources: ${sourceError.message}`);
  }

  return {
    ...report,
    sources: (sources ?? []).map((source) => ({
      id: source.id,
      speciesId: source.species_id,
      label: source.source_label,
      url: source.source_url,
      category: source.source_category,
      confidence: source.confidence,
      updatedAt: source.updated_at,
    })),
  };
}

export async function getCompatibility(
  speciesASlug: string,
  speciesBSlug: string,
): Promise<CompatibilityResult | null> {
  const report = await getCompatibilityReport(speciesASlug, speciesBSlug);
  return report?.result ?? null;
}

export async function getCompatibilityRule(
  speciesASlug: string,
  speciesBSlug: string,
): Promise<CompatibilityResult | null> {
  return getCompatibility(speciesASlug, speciesBSlug);
}

export async function getIndexableCompatibilityPairs(): Promise<
  CompatibilityPair[]
> {
  const supabase = createStaticClient();
  const [speciesResult, overrides] = await Promise.all([
    supabase.from("species").select("*").order("slug"),
    getExpertCompatibilityOverrides(supabase),
  ]);

  if (speciesResult.error) {
    throw new Error(
      `Failed to fetch species for compatibility sitemap: ${speciesResult.error.message}`,
    );
  }

  const species = speciesResult.data ?? [];
  const pairs: CompatibilityPair[] = [];

  for (let indexA = 0; indexA < species.length; indexA += 1) {
    for (let indexB = indexA + 1; indexB < species.length; indexB += 1) {
      const speciesA = species[indexA];
      const speciesB = species[indexB];
      const report = createCompatibilityReport(speciesA, speciesB, overrides);
      const sourcedSpeciesCount =
        Number(hasSpeciesSourceCoverage(speciesA.slug)) +
        Number(hasSpeciesSourceCoverage(speciesB.slug));
      const quality = getCompatibilityIndexability({
        dataConfidence: report.result.dataConfidence,
        expertValidated: report.result.expertValidated,
        reviewedResult: isReviewedCompatibilityResult(report),
        sourcedSpeciesCount,
      });

      if (quality.indexable) {
        pairs.push({ speciesA: speciesA.slug, speciesB: speciesB.slug });
      }
    }
  }

  return pairs;
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

  const overrides = await getExpertCompatibilityOverrides(
    supabase,
    currentSpecies.id,
  );

  const grouped: SpeciesCompatibilityGroup = {
    compatible: [],
    caution: [],
    incompatible: [],
  };

  for (const relatedSpecies of species) {
    if (relatedSpecies.id === currentSpecies.id) {
      continue;
    }

    const result = createCompatibilityReport(
      currentSpecies,
      relatedSpecies,
      overrides,
    ).result;

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
  const overrides = await getExpertCompatibilityOverrides(supabase);

  return species.map((speciesA) => ({
    species: toCompatibilitySpecies(speciesA),
    compatibleSpecies: species
      .filter((speciesB) => speciesB.id !== speciesA.id)
      .map(
        (speciesB) =>
          createCompatibilityReport(speciesA, speciesB, overrides).result,
      )
      .filter((result) => result.compatibility === "compatible")
      .map((result) => result.species_b),
  }));
}

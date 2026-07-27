import "server-only";

import { getPublishedCareGuidesForSpeciesSlugs } from "../../care-guides/service";
import { calculateCompatibility } from "../../compatibility/engine";
import { throwContentDatabaseError } from "../../content/database";
import { ContentServiceError } from "../../content/errors";
import { createStaticClient } from "../../supabase/static";

import type { TankMateGuideData, TankMateGuideInput } from "./types";

export async function loadTankMateGuideData(
  input: TankMateGuideInput,
): Promise<TankMateGuideData> {
  const supabase = createStaticClient();
  const { data: species, error: speciesError } = await supabase
    .from("species")
    .select("*")
    .order("common_name");

  throwContentDatabaseError(speciesError, "load tank-mate species");
  const targetSpecies = species?.find(
    (candidate) => candidate.slug === input.speciesSlug,
  );

  if (!targetSpecies) {
    throw new ContentServiceError(
      "The selected tank-mate species could not be found.",
      "not_found",
    );
  }

  const candidates = (species ?? []).filter(
    (candidate) => candidate.id !== targetSpecies.id,
  );
  const [careGuides, sourceResult] = await Promise.all([
    getPublishedCareGuidesForSpeciesSlugs(
      [targetSpecies, ...candidates].map((candidate) => candidate.slug),
    ),
    supabase
      .from("species_source_references")
      .select("*")
      .eq("species_id", targetSpecies.id)
      .order("source_category")
      .order("source_url"),
  ]);

  throwContentDatabaseError(
    sourceResult.error,
    "load tank-mate source references",
  );

  return {
    targetSpecies,
    candidates,
    compatibilityResults: candidates.map((candidate) =>
      calculateCompatibility(targetSpecies, candidate),
    ),
    careGuides: careGuides.map((guide) => ({
      id: guide.id,
      slug: guide.slug,
      title: guide.title,
      speciesSlug: guide.species.slug,
    })),
    sourceReferences: (sourceResult.data ?? []).map((source) => ({
      id: source.id,
      sourceUrl: source.source_url,
      sourceLabel: source.source_label,
      sourceCategory: source.source_category,
      confidence: source.confidence,
      updatedAt: source.updated_at,
    })),
  };
}


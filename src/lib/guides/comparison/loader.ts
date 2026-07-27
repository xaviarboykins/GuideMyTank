import "server-only";

import { getPublishedCareGuidesForSpeciesSlugs } from "../../care-guides/service";
import { calculateCompatibility } from "../../compatibility/engine";
import { ContentServiceError } from "../../content/errors";
import { throwContentDatabaseError } from "../../content/database";
import { createStaticClient } from "../../supabase/static";

import type {
  ComparisonGuideData,
  ComparisonGuideInput,
} from "./types";

export async function loadComparisonGuideData(
  input: ComparisonGuideInput,
): Promise<ComparisonGuideData> {
  const supabase = createStaticClient();
  const requestedSlugs = [...new Set([input.speciesASlug, input.speciesBSlug])];

  if (requestedSlugs.length !== 2) {
    throw new ContentServiceError(
      "A comparison Guide requires two different species.",
      "validation",
    );
  }

  const { data: species, error: speciesError } = await supabase
    .from("species")
    .select("*")
    .in("slug", requestedSlugs);

  throwContentDatabaseError(speciesError, "load comparison species");
  const speciesA = species?.find((item) => item.slug === input.speciesASlug);
  const speciesB = species?.find((item) => item.slug === input.speciesBSlug);

  if (!speciesA || !speciesB) {
    throw new ContentServiceError(
      "One or both comparison species could not be found.",
      "not_found",
    );
  }

  const [careGuides, sourceResult] = await Promise.all([
    getPublishedCareGuidesForSpeciesSlugs(requestedSlugs),
    supabase
      .from("species_source_references")
      .select("*")
      .in("species_id", [speciesA.id, speciesB.id])
      .order("source_category")
      .order("source_url"),
  ]);

  throwContentDatabaseError(
    sourceResult.error,
    "load comparison source references",
  );

  return {
    speciesA,
    speciesB,
    compatibility: calculateCompatibility(speciesA, speciesB),
    careGuides: careGuides.map((guide) => ({
      id: guide.id,
      slug: guide.slug,
      title: guide.title,
      speciesSlug: guide.species.slug,
    })),
    sourceReferences: (sourceResult.data ?? []).map((source) => ({
      id: source.id,
      speciesId: source.species_id,
      sourceUrl: source.source_url,
      sourceLabel: source.source_label,
      sourceCategory: source.source_category,
      confidence: source.confidence,
      updatedAt: source.updated_at,
    })),
  };
}


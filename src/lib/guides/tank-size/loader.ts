import "server-only";

import { getPublishedCareGuidesForSpeciesSlugs } from "../../care-guides/service";
import { throwContentDatabaseError } from "../../content/database";
import { getProductsForTankSize } from "../../products/service";
import { createStaticClient } from "../../supabase/static";

import type { TankSizeGuideData, TankSizeGuideInput } from "./types";

export async function loadTankSizeGuideData(
  input: TankSizeGuideInput,
): Promise<TankSizeGuideData> {
  const supabase = createStaticClient();
  const [speciesResult, guidelineResult, tankProducts, filters, heaters] =
    await Promise.all([
      supabase.from("species").select("*").order("common_name"),
      supabase
        .from("tank_size_guidelines")
        .select("*")
        .lte("gallons", input.gallons)
        .order("gallons", { ascending: false }),
      getProductsForTankSize("tanks", input.gallons),
      getProductsForTankSize("filters", input.gallons),
      getProductsForTankSize("heaters", input.gallons),
    ]);

  throwContentDatabaseError(speciesResult.error, "load tank-size species");
  throwContentDatabaseError(
    guidelineResult.error,
    "load tank-size guidelines",
  );

  const species = speciesResult.data ?? [];
  const careGuides = await getPublishedCareGuidesForSpeciesSlugs(
    species.map((candidate) => candidate.slug),
  );

  return {
    species,
    guidelines: (guidelineResult.data ?? []).map((guideline) => ({
      id: guideline.id,
      speciesId: guideline.species_id,
      gallons: guideline.gallons,
      scenario: guideline.scenario,
      notes: guideline.notes,
    })),
    careGuides: careGuides.map((guide) => ({
      id: guide.id,
      slug: guide.slug,
      title: guide.title,
      speciesSlug: guide.species.slug,
    })),
    products: [...tankProducts, ...filters, ...heaters],
  };
}


import "server-only";

import { generateOrRegenerateGuideDraft } from "../generation/orchestrator";
import { createComparisonGenerationKey } from "../generation/identity";

import { createSpeciesComparisonGenerator } from "./generator";
import type { ComparisonGuideInput } from "./types";

export async function generateSpeciesComparisonDraft(
  input: ComparisonGuideInput,
) {
  const generationKey = createComparisonGenerationKey(
    input.speciesASlug,
    input.speciesBSlug,
  );

  return generateOrRegenerateGuideDraft(
    {
      family: "species_comparison",
      guideType: "comparison",
      generationKey,
      input,
    },
    createSpeciesComparisonGenerator(),
  );
}


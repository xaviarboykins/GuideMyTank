import "server-only";

import { createTankMateGenerationKey } from "../generation/identity";
import { generateOrRegenerateGuideDraft } from "../generation/orchestrator";

import { createTankMateGuideGenerator } from "./generator";
import type { TankMateGuideInput } from "./types";

export async function generateTankMateGuideDraft(input: TankMateGuideInput) {
  const generationKey = createTankMateGenerationKey(
    input.speciesSlug,
    input.variant,
  );

  return generateOrRegenerateGuideDraft(
    {
      family: "tank_mates",
      guideType: input.variant,
      generationKey,
      input,
    },
    createTankMateGuideGenerator(input.variant),
  );
}


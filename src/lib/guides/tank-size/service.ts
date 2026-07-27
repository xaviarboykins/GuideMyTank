import "server-only";

import { createTankSizeGenerationKey } from "../generation/identity";
import { generateOrRegenerateGuideDraft } from "../generation/orchestrator";

import { createTankSizeGuideGenerator } from "./generator";
import type { TankSizeGuideInput } from "./types";

export async function generateTankSizeGuideDraft(input: TankSizeGuideInput) {
  const generationKey = createTankSizeGenerationKey(
    input.gallons,
    input.variation === "community" ? input.variation : undefined,
  );

  return generateOrRegenerateGuideDraft(
    {
      family: "tank_size",
      guideType: input.variation,
      generationKey,
      input,
    },
    createTankSizeGuideGenerator(input.variation),
  );
}


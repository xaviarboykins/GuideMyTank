"use server";

import type { AquariumBuild } from "@/lib/aquarium-builder/types";
import { resolveAquariumLivestock } from "@/lib/aquarium-builder/service";
import type { StockingAnalysisResult } from "@/lib/aquarium-builder/stocking-analysis";
import {
  validateAquarium,
  type AquariumValidationReport,
} from "@/lib/aquarium-validation";

export async function runAquariumBuilderValidation(
  build: AquariumBuild,
  stockingAnalysis: StockingAnalysisResult,
): Promise<AquariumValidationReport> {
  const { resolvedLivestock } = await resolveAquariumLivestock(build.livestock);

  return validateAquarium(build, {
    context: {
      species: resolvedLivestock,
      stockingAnalysis,
    },
  });
}

"use server";

import type { AquariumBuild } from "@/lib/aquarium-builder/types";
import { analyzeAquariumBuild } from "@/lib/aquarium-builder/service";
import type { StockingAnalysisResult } from "@/lib/aquarium-builder/stocking-analysis";

export async function runAquariumBuilderAnalysis(
  build: AquariumBuild,
  stockingAnalysis: StockingAnalysisResult,
) {
  const result = await analyzeAquariumBuild(build, { stockingAnalysis });

  return {
    validation: result.analysis.validation,
    buildHealth: result.analysis.buildHealth,
  };
}

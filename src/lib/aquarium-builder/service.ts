import type {
  AquariumBuild,
  AquariumBuilderRecommendation,
  AquariumBuilderResult,
  AquariumBuilderSeverity,
  AquariumBuilderWarning,
  AquariumEstimatedCost,
  AquariumLivestockEntry,
  AquariumResolvedLivestockEntry,
} from "./types";
import {
  analyzeStocking,
  normalizeStockingAnalysisInput,
  type StockingAnalysisResult,
} from "./stocking-analysis/index";
import { getCompatibility } from "../compatibility/service";
import type { CompatibilityResult } from "../compatibility/types";
import { getSpeciesBySlug } from "../data/species";
import { getProductById } from "../products/service";
import type { Product } from "../products/types";
import { deriveAquariumBuildHealth } from "../aquarium-analysis/build-health";
import {
  generateUniqueSpeciesPairs,
  validateAquarium,
  type AquariumCompatibilityResolver,
  type AquariumValidationOptions,
  type ResolvedCompatibilityResult,
} from "../aquarium-validation/index";

export interface AquariumAnalysisDependencies {
  compatibilityResolver?: AquariumCompatibilityResolver;
  speciesResolver?: typeof getSpeciesBySlug;
  heaterProductResolver?: typeof getProductById;
  stockingAnalysis?: StockingAnalysisResult;
  now?: AquariumValidationOptions["now"];
}

const DEFAULT_CURRENCY: AquariumEstimatedCost["currency"] = "USD";

function createWarning(
  code: string,
  message: string,
  severity: AquariumBuilderSeverity = "warning",
): AquariumBuilderWarning {
  return {
    code,
    message,
    severity,
  };
}

function createRecommendation(
  code: string,
  message: string,
  severity: AquariumBuilderSeverity = "info",
  livestock?: AquariumLivestockEntry[],
): AquariumBuilderRecommendation {
  return {
    code,
    message,
    severity,
    livestock,
  };
}

function isPositiveNumber(value: number) {
  return Number.isFinite(value) && value > 0;
}

export function validateAquariumBuild(
  build: AquariumBuild,
): AquariumBuilderWarning[] {
  const warnings: AquariumBuilderWarning[] = [];

  if (!isPositiveNumber(build.tank.sizeGallons)) {
    warnings.push(
      createWarning(
        "invalid-tank-size",
        "Tank size must be greater than zero gallons.",
        "critical",
      ),
    );
  }

  for (const livestock of build.livestock) {
    if (!livestock.speciesSlug.trim()) {
      warnings.push(
        createWarning(
          "missing-livestock-species",
          "Each livestock entry must include a species slug.",
          "critical",
        ),
      );
    }

    if (!Number.isInteger(livestock.quantity) || livestock.quantity <= 0) {
      warnings.push(
        createWarning(
          "invalid-livestock-quantity",
          "Livestock quantities must be positive whole numbers.",
          "critical",
        ),
      );
    }
  }

  for (const plant of build.plants) {
    if (!plant.plantId.trim()) {
      warnings.push(
        createWarning(
          "missing-plant",
          "Each plant entry must include a plant ID.",
          "critical",
        ),
      );
    }

    if (!Number.isInteger(plant.quantity) || plant.quantity <= 0) {
      warnings.push(
        createWarning(
          "invalid-plant-quantity",
          "Plant quantities must be positive whole numbers.",
          "critical",
        ),
      );
    }
  }

  for (const equipment of build.equipment) {
    if (!equipment.name.trim()) {
      warnings.push(
        createWarning(
          "missing-equipment-name",
          "Each equipment product must include a name.",
          "critical",
        ),
      );
    }

    if (!Number.isInteger(equipment.quantity) || equipment.quantity <= 0) {
      warnings.push(
        createWarning(
          "invalid-equipment-quantity",
          "Equipment quantities must be positive whole numbers.",
          "critical",
        ),
      );
    }

    if (
      equipment.estimatedPrice < 0 ||
      !Number.isFinite(equipment.estimatedPrice)
    ) {
      warnings.push(
        createWarning(
          "invalid-equipment-price",
          "Equipment estimated prices must be zero or greater.",
          "critical",
        ),
      );
    }
  }

  return warnings;
}

export function calculateEstimatedCost(
  build: AquariumBuild,
): AquariumEstimatedCost {
  const equipmentSubtotal = build.equipment.reduce((subtotal, equipment) => {
    if (
      !Number.isFinite(equipment.estimatedPrice) ||
      !Number.isInteger(equipment.quantity) ||
      equipment.quantity <= 0
    ) {
      return subtotal;
    }

    return subtotal + equipment.estimatedPrice * equipment.quantity;
  }, 0);

  return {
    equipmentSubtotal,
    totalEstimatedCost: equipmentSubtotal,
    currency: DEFAULT_CURRENCY,
  };
}

export async function resolveAquariumLivestock(
  livestock: AquariumLivestockEntry[],
  speciesResolver: typeof getSpeciesBySlug = getSpeciesBySlug,
): Promise<{
  resolvedLivestock: AquariumResolvedLivestockEntry[];
  warnings: AquariumBuilderWarning[];
}> {
  const warnings: AquariumBuilderWarning[] = [];

  const resolvedLivestock = await Promise.all(
    livestock
      .filter((entry) => entry.speciesSlug.trim())
      .map(async (entry) => {
        const species = await speciesResolver(entry.speciesSlug);

        if (!species) {
          warnings.push(
            createWarning(
              "livestock-species-not-found",
              `No species found for slug "${entry.speciesSlug}".`,
              "critical",
            ),
          );

          return null;
        }

        return {
          ...entry,
          species,
        };
      }),
  );

  return {
    resolvedLivestock: resolvedLivestock.filter(
      (entry): entry is AquariumResolvedLivestockEntry => entry !== null,
    ),
    warnings,
  };
}

export async function analyzeLivestockCompatibility(
  livestock: AquariumResolvedLivestockEntry[],
  compatibilityResolver: AquariumCompatibilityResolver = getCompatibility,
): Promise<{
  compatibility: CompatibilityResult[];
  compatibilityResults: ResolvedCompatibilityResult[];
  warnings: AquariumBuilderWarning[];
}> {
  const compatibility: CompatibilityResult[] = [];
  const compatibilityResults: ResolvedCompatibilityResult[] = [];
  const warnings: AquariumBuilderWarning[] = [];
  const uniqueSpeciesSlugs = Array.from(
    new Set(livestock.map((entry) => entry.species.slug)),
  );

  for (let index = 0; index < uniqueSpeciesSlugs.length; index += 1) {
    for (
      let relatedIndex = index + 1;
      relatedIndex < uniqueSpeciesSlugs.length;
      relatedIndex += 1
    ) {
      const speciesASlug = uniqueSpeciesSlugs[index];
      const speciesBSlug = uniqueSpeciesSlugs[relatedIndex];
      const result = await compatibilityResolver(speciesASlug, speciesBSlug);
      const speciesA = livestock.find(
        (entry) => entry.species.slug === speciesASlug,
      );
      const speciesB = livestock.find(
        (entry) => entry.species.slug === speciesBSlug,
      );

      if (speciesA && speciesB) {
        compatibilityResults.push({
          speciesAId: speciesA.species.id,
          speciesBId: speciesB.species.id,
          result,
        });
      }

      if (!result) {
        warnings.push(
          createWarning(
            "compatibility-result-not-found",
            `Compatibility could not be analyzed for "${speciesASlug}" and "${speciesBSlug}".`,
          ),
        );

        continue;
      }

      compatibility.push(result);
    }
  }

  return {
    compatibility,
    compatibilityResults,
    warnings,
  };
}

export function analyzeStockingGuidance(
  build: AquariumBuild,
  livestock: AquariumResolvedLivestockEntry[],
): {
  warnings: AquariumBuilderWarning[];
  recommendations: AquariumBuilderRecommendation[];
} {
  const warnings: AquariumBuilderWarning[] = [];
  const recommendations: AquariumBuilderRecommendation[] = [];

  for (const entry of livestock) {
    const minimumTankGallons = entry.species.tank_size_gal;
    const minimumGroupSize = entry.species.min_group_size;

    if (
      minimumTankGallons != null &&
      build.tank.sizeGallons < minimumTankGallons
    ) {
      warnings.push({
        code: "tank-below-species-minimum",
        message: `${entry.species.common_name} is listed for tanks of at least ${minimumTankGallons} gallons.`,
        severity: "critical",
        livestock: [entry],
      });
    }

    if (minimumGroupSize != null && entry.quantity < minimumGroupSize) {
      recommendations.push(
        createRecommendation(
          "livestock-below-minimum-group-size",
          `${entry.species.common_name} is listed with a minimum group size of ${minimumGroupSize}.`,
          "warning",
          [entry],
        ),
      );
    }
  }

  return {
    warnings,
    recommendations,
  };
}

export function analyzeAquariumStocking(
  build: AquariumBuild,
  resolvedLivestock: AquariumResolvedLivestockEntry[],
): StockingAnalysisResult {
  return analyzeStocking(
    normalizeStockingAnalysisInput(
      build,
      resolvedLivestock.map((entry) => entry.species),
    ),
  );
}

export async function analyzeAquariumBuild(
  build: AquariumBuild,
  dependencies: AquariumAnalysisDependencies = {},
): Promise<AquariumBuilderResult> {
  const validationWarnings = validateAquariumBuild(build);
  const estimatedCost = calculateEstimatedCost(build);
  const { resolvedLivestock, warnings: livestockWarnings } =
    await resolveAquariumLivestock(
      build.livestock,
      dependencies.speciesResolver,
    );
  const {
    compatibility,
    compatibilityResults,
    warnings: compatibilityWarnings,
  } = await analyzeLivestockCompatibility(
    resolvedLivestock,
    dependencies.compatibilityResolver,
  );
  const {
    warnings: stockingWarnings,
    recommendations: stockingRecommendations,
  } = analyzeStockingGuidance(build, resolvedLivestock);
  const stocking =
    dependencies.stockingAnalysis ??
    analyzeAquariumStocking(build, resolvedLivestock);
  const selectedHeaterProductId =
    build.equipmentProductIds?.heaterProductId ??
    build.equipment.find((item) => item.category === "heater")?.productId;
  let heaterProduct: Product | null | undefined;
  let heaterProductWarning: AquariumBuilderWarning | null = null;

  if (selectedHeaterProductId) {
    try {
      heaterProduct = await (
        dependencies.heaterProductResolver ?? getProductById
      )(selectedHeaterProductId);
    } catch {
      heaterProduct = null;
      heaterProductWarning = createWarning(
        "heater-product-resolution-failed",
        "The selected heater could not be loaded from the product catalog.",
      );
    }
  }
  const validation = await validateAquarium(build, {
    context: {
      species: resolvedLivestock,
      speciesPairs: generateUniqueSpeciesPairs(resolvedLivestock),
      compatibilityResults,
      heaterProduct,
      stockingAnalysis: stocking,
    },
    now: dependencies.now,
  });
  const buildHealth = deriveAquariumBuildHealth({
    build,
    stocking,
    validation,
  });

  return {
    build,
    livestock: resolvedLivestock,
    estimatedCost,
    analysis: {
      compatibility,
      stocking,
      validation,
      buildHealth,
      warnings: [
        ...validationWarnings,
        ...livestockWarnings,
        ...compatibilityWarnings,
        ...stockingWarnings,
        ...(heaterProductWarning ? [heaterProductWarning] : []),
      ],
      recommendations: stockingRecommendations,
    },
  };
}

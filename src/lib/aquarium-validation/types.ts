import type {
  AquariumBuild,
  AquariumResolvedLivestockEntry,
} from "@/lib/aquarium-builder/types";
import type { StockingAnalysisResult } from "@/lib/aquarium-builder/stocking-analysis/types";
import type { CompatibilityResult } from "@/lib/compatibility/types";

export type AquariumValidationInput = AquariumBuild;

export type ValidationSeverity = "info" | "warning" | "error";

export type ValidationCategory =
  | "compatibility"
  | "predation"
  | "territorial"
  | "school_size"
  | "water_parameters"
  | "tank_size"
  | "stocking";

export interface AquariumValidationIssue {
  id: string;
  code: string;
  category: ValidationCategory;
  severity: ValidationSeverity;
  title: string;
  message: string;
  recommendation?: string;
  affectedSpeciesIds: string[];
  metadata?: Record<string, unknown>;
}

export interface AquariumValidationSummary {
  infoCount: number;
  warningCount: number;
  errorCount: number;
  totalCount: number;
}

export interface AquariumValidationReport {
  valid: boolean;
  issues: AquariumValidationIssue[];
  summary: AquariumValidationSummary;
  evaluatedAt: string;
}

export interface AquariumSpeciesPair {
  speciesA: AquariumResolvedLivestockEntry;
  speciesB: AquariumResolvedLivestockEntry;
  key: string;
}

export interface ResolvedCompatibilityResult {
  speciesAId: string;
  speciesBId: string;
  result: CompatibilityResult | null;
}

export type AquariumCompatibilityResolver = (
  speciesASlug: string,
  speciesBSlug: string,
) => Promise<CompatibilityResult | null>;

export interface AquariumValidatorContext {
  input: AquariumValidationInput;
  species: AquariumResolvedLivestockEntry[];
  speciesPairs: AquariumSpeciesPair[];
  compatibilityResults: ResolvedCompatibilityResult[];
  stockingAnalysis?: StockingAnalysisResult | null;
}

export interface AquariumValidator {
  name: string;
  validate(
    context: AquariumValidatorContext,
  ): Promise<AquariumValidationIssue[]>;
}

export interface AquariumValidationOptions {
  validators?: readonly AquariumValidator[];
  context?: Partial<Omit<AquariumValidatorContext, "input">>;
  compatibilityResolver?: AquariumCompatibilityResolver;
  now?: () => Date;
  onValidatorError?: (validatorName: string, error: unknown) => void;
  onCompatibilityError?: (pairKey: string, error: unknown) => void;
}

import type { Database } from "@/types/database.types";

export type SpeciesRow = Database["public"]["Tables"]["species"]["Row"];

export type CompatibilitySpecies = {
  slug: string;
  common_name: string;
};

export type CompatibilityStatus =
  | "High Compatibility"
  | "Compatible"
  | "Caution"
  | "Incompatible";

export type EvaluationResult = {
  points: number;
  reasons: string[];
  scoreCap?: number;
};

export type CompatibilityEvaluationDiagnostic = EvaluationResult & {
  code: string;
};

export type CompatibilityFindingCategory =
  | "environment"
  | "water-parameters"
  | "predation"
  | "temperament"
  | "territory"
  | "fin-risk"
  | "grouping"
  | "space"
  | "habitat"
  | "flow"
  | "oxygen"
  | "feeding"
  | "stocking"
  | "configuration"
  | "override"
  | "data-quality";

export type CompatibilityFindingSeverity = "info" | "warning" | "error";

export type CompatibilityFinding = {
  code: string;
  category: CompatibilityFindingCategory;
  severity: CompatibilityFindingSeverity;
  message: string;
  evidence?: Record<string, unknown>;
};

export type CompatibilityDiagnostics = {
  result: CompatibilityResult;
  legacyResult: CompatibilityResult;
  rawScore: number;
  scoreCap: number | null;
  evaluations: CompatibilityEvaluationDiagnostic[];
  findings: CompatibilityFinding[];
};

export type CompatibilityResultSource = "computed" | "expert-override";

export type CompatibilityVerdict =
  | "recommended"
  | "conditional"
  | "not-recommended";

export type CompatibilityDataConfidence = "high" | "moderate" | "limited";

export type CompatibilityReportFactors = {
  blockingRisks: CompatibilityFinding[];
  conditions: CompatibilityFinding[];
  supportingFactors: CompatibilityFinding[];
};

export type CompatibilityReportSource = {
  id: string;
  speciesId: string;
  label: string | null;
  url: string;
  category: string;
  confidence: string;
  updatedAt: string;
};

export type CompatibilityPairAnalysis = {
  version: string;
  sourceDataUpdatedAt: string | null;
  overview: string;
  water: string;
  space: string;
  behavior: string;
  husbandry: string;
  keyFindings: string[];
  checklist: string[];
};

export type CompatibilityReport = CompatibilityDiagnostics & {
  computedResult: CompatibilityResult;
  source: CompatibilityResultSource;
  expertNotes: string | null;
  factors: CompatibilityReportFactors;
  sources: CompatibilityReportSource[];
  analysis: CompatibilityPairAnalysis;
};

export type CompatibilityResult = {
  score: number;
  status: CompatibilityStatus;
  reasons: string[];

  compatibility: "compatible" | "caution" | "incompatible" | null;
  confidence: number | null;
  notes: string | null;
  expertValidated: boolean;
  verdict: CompatibilityVerdict;
  recommendation: string;
  dataConfidence: CompatibilityDataConfidence;

  species_a: CompatibilitySpecies;
  species_b: CompatibilitySpecies;
};

export type SpeciesCompatibilityGroup = {
  compatible: CompatibilityResult[];
  caution: CompatibilityResult[];
  incompatible: CompatibilityResult[];
};

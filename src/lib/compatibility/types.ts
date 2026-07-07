import type { Database } from "@/types/database.types";

export type SpeciesRow = Database["public"]["Tables"]["species"]["Row"];

export type CompatibilitySpecies = {
  slug: string;
  common_name: string;
};

export type CompatibilityStatus =
  | "Overwhelmingly Compatible"
  | "Very Compatible"
  | "Compatible"
  | "Caution"
  | "Incompatible";

export type EvaluationResult = {
  points: number;
  reasons: string[];
};

export type CompatibilityResult = {
  score: number;
  status: CompatibilityStatus;
  reasons: string[];

  compatibility: "compatible" | "caution" | "incompatible" | null;
  confidence: number | null;
  notes: string | null;

  species_a: CompatibilitySpecies;
  species_b: CompatibilitySpecies;
};

export type SpeciesCompatibilityGroup = {
  compatible: CompatibilityResult[];
  caution: CompatibilityResult[];
  incompatible: CompatibilityResult[];
};

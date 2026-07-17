import { validateContentSlug } from "../content/slug";
import { validateCareGuideSectionContent } from "../content/structured-data";
import type { ValidationIssue, ValidationResult } from "../content/types";
import type { Json } from "../../types/database.types";

export const REQUIRED_CARE_GUIDE_SECTIONS = [
  "overview",
  "natural_habitat",
  "adult_size_and_lifespan",
  "aquarium_requirements",
  "water_parameters",
  "filtration_and_flow",
  "heating_requirements",
  "lighting",
  "substrate",
  "plants_and_decor",
  "behavior_and_temperament",
  "social_requirements",
  "tank_mates",
  "species_to_avoid",
  "diet_and_feeding",
  "common_health_concerns",
  "breeding",
  "beginner_guidance",
] as const;

export const REQUIRED_QUICK_FACTS = [
  "scientific_name",
  "adult_size",
  "lifespan",
  "minimum_tank_size",
  "care_level",
  "temperament",
  "diet",
  "social_requirements",
  "temperature_range",
  "ph_range",
] as const;

type CareGuidePublicationData = {
  speciesId: string | null;
  title: string | null;
  slug: string | null;
  summary: string | null;
  quickFacts: Record<string, Json | undefined>;
  sections: Array<{ sectionType: string; content: Json }>;
  images: Array<{ imageId: string; speciesId: string | null; isPrimary: boolean; altText: string | null }>;
  sourceCount: number;
  slugAvailable: boolean;
};

function hasMeaningfulValue(value: unknown) {
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return value !== null && value !== undefined;
}

export function validateCareGuideForPublication(data: CareGuidePublicationData): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!data.speciesId) issues.push({ field: "speciesId", code: "required", message: "Select a species from the database." });
  if (!data.title?.trim()) issues.push({ field: "title", code: "required", message: "Enter a title." });
  if (!data.summary?.trim()) issues.push({ field: "summary", code: "required", message: "Enter a summary." });
  issues.push(...validateContentSlug(data.slug));
  if (!data.slugAvailable) issues.push({ field: "slug", code: "conflict", message: "This Care Guide slug is already in use." });

  for (const fact of REQUIRED_QUICK_FACTS) {
    if (!hasMeaningfulValue(data.quickFacts[fact])) {
      issues.push({ field: `quickFacts.${fact}`, code: "required", message: `Complete the ${fact.replaceAll("_", " ")} quick fact.` });
    }
  }

  for (const sectionType of REQUIRED_CARE_GUIDE_SECTIONS) {
    const section = data.sections.find((item) => item.sectionType === sectionType);
    if (!section) {
      issues.push({ field: `sections.${sectionType}`, code: "required", message: `Complete the ${sectionType.replaceAll("_", " ")} section.` });
      continue;
    }

    const sectionValidation = validateCareGuideSectionContent(sectionType, section.content);
    if (!sectionValidation.valid) {
      issues.push(...sectionValidation.issues);
    }
  }

  if (data.images.length < 2) issues.push({ field: "images", code: "minimum", message: "Add at least two uploaded Care Guide images." });
  if (data.images.filter((image) => image.isPrimary).length !== 1) issues.push({ field: "images.primary", code: "primary", message: "Select exactly one primary image." });

  for (const image of data.images) {
    if (!image.altText?.trim()) issues.push({ field: `images.${image.imageId}.altText`, code: "required", message: "Every Care Guide image needs alt text." });
    if (!image.speciesId || image.speciesId !== data.speciesId) issues.push({ field: `images.${image.imageId}`, code: "species", message: "Care Guide images must be uploaded for the associated species." });
  }

  if (data.sourceCount < 1) issues.push({ field: "sources", code: "minimum", message: "Add at least one source." });

  return issues.length === 0 ? { valid: true, issues: [] } : { valid: false, issues };
}

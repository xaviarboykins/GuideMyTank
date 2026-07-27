import { validateContentSlug } from "../../content/slug";
import {
  isJsonRecord,
  validateArticleBlockContent,
} from "../../content/structured-data";
import type {
  ValidationIssue,
  ValidationReport,
} from "../../content/types";
import { normalizeInternalPath } from "../../seo/internal-linking/route-resolver";
import { IMPLEMENTED_GUIDE_FAMILIES } from "../types";

import type { GuidePublicationValidationInput } from "./types";

const GENERATION_KEY_PATTERN =
  /^[a-z0-9]+:[a-z0-9]+(?:-[a-z0-9]+)*$/;

function error(field: string, code: string, message: string): ValidationIssue {
  return { field, code, message, severity: "error" };
}

function warning(
  field: string,
  code: string,
  message: string,
): ValidationIssue {
  return { field, code, message, severity: "warning" };
}

function arrayValue(record: Record<string, unknown>, key: string) {
  return Array.isArray(record[key]) ? record[key] : [];
}

function metadataRecord(value: GuidePublicationValidationInput["metadata"]["generationMetadata"]) {
  return isJsonRecord(value) ? value : {};
}

function recommendationCount(
  metadata: ReturnType<typeof metadataRecord>,
  key: string,
) {
  const recommendationCounts = metadata.recommendationCounts;
  const suitabilityCounts = metadata.suitabilityCounts;
  const counts =
    recommendationCounts && isJsonRecord(recommendationCounts)
      ? recommendationCounts
      : suitabilityCounts && isJsonRecord(suitabilityCounts)
        ? suitabilityCounts
        : {};
  const value = counts[key];
  return typeof value === "number" ? value : 0;
}

function validateFamilyRequirements(
  input: GuidePublicationValidationInput,
  errors: ValidationIssue[],
) {
  const blockTypes = new Set(input.sections.map((section) => section.blockType));
  const metadata = metadataRecord(input.metadata.generationMetadata);

  for (const requiredType of ["paragraph", "heading", "faq_group"]) {
    if (!blockTypes.has(requiredType)) {
      errors.push(
        error(
          "sections",
          "required",
          `The Guide requires a ${requiredType.replaceAll("_", " ")} block.`,
        ),
      );
    }
  }

  if (input.metadata.guideFamily === "species_comparison") {
    if (!blockTypes.has("comparison_table") || !blockTypes.has("warning")) {
      errors.push(
        error(
          "sections",
          "comparison_structure",
          "Species comparison Guides require a comparison table and safety warning.",
        ),
      );
    }
    const speciesIds = arrayValue(metadata, "speciesIds");
    if (speciesIds.length !== 2 || speciesIds[0] === speciesIds[1]) {
      errors.push(
        error(
          "generationMetadata.speciesIds",
          "source_entities",
          "Species comparison Guides require two distinct source species.",
        ),
      );
    }
  }

  if (input.metadata.guideFamily === "tank_mates") {
    const key =
      input.metadata.guideType === "avoid-with" ? "avoid" : "recommended";
    if (recommendationCount(metadata, key) < 1) {
      errors.push(
        error(
          `generationMetadata.recommendationCounts.${key}`,
          "minimum",
          `This Guide requires at least one confident ${key} classification.`,
        ),
      );
    }
  }

  if (input.metadata.guideFamily === "tank_size") {
    if (recommendationCount(metadata, "suitable") < 3) {
      errors.push(
        error(
          "generationMetadata.suitabilityCounts.suitable",
          "minimum",
          "Tank-size Guides require at least three suitable species.",
        ),
      );
    }
    if (!blockTypes.has("comparison_table") || !blockTypes.has("warning")) {
      errors.push(
        error(
          "sections",
          "tank_size_structure",
          "Tank-size Guides require a species table and stocking warning.",
        ),
      );
    }
  }
}

function validateInternalLinks(
  input: GuidePublicationValidationInput,
  errors: ValidationIssue[],
  warnings: ValidationIssue[],
) {
  const metadata = metadataRecord(input.metadata.generationMetadata);
  const links = arrayValue(metadata, "internalLinks");

  if (!links.length) {
    errors.push(
      error(
        "generationMetadata.internalLinks",
        "minimum",
        "The Guide requires generated internal links.",
      ),
    );
    return;
  }

  for (const [index, value] of links.entries()) {
    if (!isJsonRecord(value) || typeof value.href !== "string") {
      errors.push(
        error(
          `generationMetadata.internalLinks.${index}`,
          "format",
          "An internal-link suggestion is malformed.",
        ),
      );
      continue;
    }
    if (!normalizeInternalPath(value.href)) {
      errors.push(
        error(
          `generationMetadata.internalLinks.${index}.href`,
          "unresolved",
          `Internal link ${value.href} is not a valid internal path.`,
        ),
      );
    }
  }

  const references = arrayValue(metadata, "sourceReferences");
  for (const [index, value] of references.entries()) {
    if (
      !isJsonRecord(value) ||
      typeof value.url !== "string" ||
      !/^https?:\/\//.test(value.url)
    ) {
      warnings.push(
        warning(
          `generationMetadata.sourceReferences.${index}`,
          "reference_format",
          "A generated source-reference suggestion has an invalid URL.",
        ),
      );
    }
  }
}

export function validateGuideForPublication(
  input: GuidePublicationValidationInput,
): ValidationReport {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  if (!input.title?.trim()) {
    errors.push(error("title", "required", "Enter a Guide title."));
  }
  if (!input.summary?.trim()) {
    errors.push(error("summary", "required", "Enter a Guide summary."));
  }
  if (!input.seoTitle?.trim()) {
    errors.push(error("seoTitle", "required", "Enter an SEO title."));
  }
  if (!input.metaDescription?.trim()) {
    errors.push(
      error("metaDescription", "required", "Enter a meta description."),
    );
  }
  errors.push(
    ...validateContentSlug(input.slug).map((issue) => ({
      ...issue,
      severity: "error" as const,
    })),
  );

  if (!input.slugUnique) {
    errors.push(error("slug", "conflict", "This content slug is already in use."));
  }
  if (!input.canonicalUrlUnique) {
    errors.push(
      error(
        "canonicalUrl",
        "conflict",
        "This canonical URL is already assigned to other content.",
      ),
    );
  }

  if (
    !IMPLEMENTED_GUIDE_FAMILIES.includes(
      input.metadata
        .guideFamily as (typeof IMPLEMENTED_GUIDE_FAMILIES)[number],
    )
  ) {
    errors.push(
      error(
        "guideFamily",
        "unsupported",
        "This Guide family is not implemented.",
      ),
    );
  }
  if (!input.metadata.guideType.trim()) {
    errors.push(error("guideType", "required", "Guide type is required."));
  }
  if (!GENERATION_KEY_PATTERN.test(input.metadata.generationKey)) {
    errors.push(
      error(
        "generationKey",
        "format",
        "The generation key is not normalized.",
      ),
    );
  }
  if (!input.generationKeyUnique) {
    errors.push(
      error(
        "generationKey",
        "duplicate",
        "Another Guide uses this generation key.",
      ),
    );
  }
  if (!input.metadata.primarySearchIntent.trim()) {
    errors.push(
      error(
        "primarySearchIntent",
        "required",
        "Primary search intent is required.",
      ),
    );
  }
  if (!input.metadata.normalizedSearchIntent.trim()) {
    errors.push(
      error(
        "normalizedSearchIntent",
        "required",
        "Normalized search intent is required.",
      ),
    );
  }
  if (!input.normalizedSearchIntentUnique) {
    errors.push(
      error(
        "normalizedSearchIntent",
        "duplicate",
        "Another Guide has the same normalized primary search intent.",
      ),
    );
  }
  if (input.metadata.searchIntentConflictStatus === "exact") {
    errors.push(
      error(
        "searchIntentConflictStatus",
        "unresolved",
        "Resolve the exact search-intent conflict before publishing.",
      ),
    );
  } else if (input.metadata.searchIntentConflictStatus === "potential") {
    warnings.push(
      warning(
        "searchIntentConflictStatus",
        "editorial_review",
        "Review the potential search-intent overlap before publishing.",
      ),
    );
  }
  if (!input.metadata.sourceDataFingerprint) {
    errors.push(
      error(
        "sourceDataFingerprint",
        "required",
        "A source-data fingerprint is required.",
      ),
    );
  }
  if (
    !input.metadata.generatedContentHash ||
    !input.metadata.currentContentHash
  ) {
    errors.push(
      error(
        "contentHash",
        "required",
        "Generated and current content hashes are required.",
      ),
    );
  }
  if (input.metadata.manualEditsDetected) {
    warnings.push(
      warning(
        "manualEditsDetected",
        "editorial_review",
        "This Guide contains manual edits; confirm them during editorial review.",
      ),
    );
  }

  if (!input.sections.length) {
    errors.push(
      error("sections", "minimum", "The Guide requires meaningful content."),
    );
  }
  for (const section of input.sections) {
    const result = validateArticleBlockContent(
      section.blockType,
      section.content,
    );
    if (!result.valid) {
      errors.push(
        ...result.issues.map((issue) => ({
          ...issue,
          severity: "error" as const,
        })),
      );
    }
  }

  validateFamilyRequirements(input, errors);
  validateInternalLinks(input, errors, warnings);

  errors.push(
    ...(input.conflictErrors ?? []).map((issue) => ({
      ...issue,
      severity: "error" as const,
    })),
  );
  warnings.push(
    ...(input.conflictWarnings ?? []).map((issue) => ({
      ...issue,
      severity: "warning" as const,
    })),
  );

  return { valid: errors.length === 0, errors, warnings };
}

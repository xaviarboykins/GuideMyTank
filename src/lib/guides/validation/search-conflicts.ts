import { normalizeContentSlug } from "../../content/slug";
import type { ValidationIssue } from "../../content/types";
import { normalizeSearchIntent } from "../generation/identity";

export type SearchConflictCandidate = {
  id: string;
  contentType: "guide" | "article" | "care_guide";
  title: string | null;
  slug: string | null;
  normalizedSearchIntent?: string | null;
  generationKey?: string | null;
  guideFamily?: string | null;
  guideType?: string | null;
  sourceEntityKeys?: string[];
};

export type SearchConflictSubject = {
  id: string;
  title: string;
  slug: string;
  normalizedSearchIntent: string;
  generationKey: string;
  guideFamily: string;
  guideType: string;
  sourceEntityKeys: string[];
};

function issue(
  severity: "error" | "warning",
  field: string,
  code: string,
  message: string,
): ValidationIssue {
  return { severity, field, code, message };
}

function entitySignature(values: string[] = []) {
  return [...new Set(values.map((value) => value.trim().toLowerCase()))]
    .sort()
    .join("|");
}

export function detectGuideSearchConflicts(
  subject: SearchConflictSubject,
  candidates: SearchConflictCandidate[],
) {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const normalizedTitle = normalizeSearchIntent(subject.title);
  const normalizedSlug = normalizeContentSlug(subject.slug);
  const subjectEntitySignature = entitySignature(subject.sourceEntityKeys);

  for (const candidate of candidates) {
    if (candidate.id === subject.id) continue;

    const label =
      candidate.title?.trim() ||
      candidate.slug?.trim() ||
      `${candidate.contentType} ${candidate.id}`;

    if (
      candidate.contentType === "guide" &&
      candidate.generationKey === subject.generationKey
    ) {
      errors.push(
        issue(
          "error",
          "generationKey",
          "duplicate",
          `Guide “${label}” uses the same generation key.`,
        ),
      );
      continue;
    }

    if (
      candidate.contentType === "guide" &&
      candidate.normalizedSearchIntent === subject.normalizedSearchIntent
    ) {
      errors.push(
        issue(
          "error",
          "normalizedSearchIntent",
          "exact_search_intent",
          `Guide “${label}” targets the same normalized search intent.`,
        ),
      );
    }

    if (
      candidate.contentType === "guide" &&
      candidate.guideFamily === subject.guideFamily &&
      candidate.guideType === subject.guideType &&
      subjectEntitySignature &&
      entitySignature(candidate.sourceEntityKeys) === subjectEntitySignature
    ) {
      errors.push(
        issue(
          "error",
          "generationMetadata",
          "duplicate_source_identity",
          `Guide “${label}” uses the same family and source entities.`,
        ),
      );
    }

    if (
      candidate.slug &&
      normalizeContentSlug(candidate.slug) === normalizedSlug
    ) {
      const target = candidate.contentType === "guide" ? errors : warnings;
      target.push(
        issue(
          candidate.contentType === "guide" ? "error" : "warning",
          "slug",
          candidate.contentType === "guide"
            ? "route_collision"
            : "cross_type_slug_overlap",
          `“${label}” uses the same normalized slug in the ${candidate.contentType.replace("_", " ")} content type.`,
        ),
      );
    }

    const candidateTitle = candidate.title
      ? normalizeSearchIntent(candidate.title)
      : "";
    if (
      candidateTitle &&
      (candidateTitle === normalizedTitle ||
        candidateTitle === subject.normalizedSearchIntent)
    ) {
      warnings.push(
        issue(
          "warning",
          "title",
          "potential_search_overlap",
          `“${label}” has a matching normalized title and needs editorial review.`,
        ),
      );
    }
  }

  return { errors, warnings };
}

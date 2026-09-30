import { validateContentSlug } from "../content/slug";
import {
  countContentWords,
  validateArticleBlockContent,
} from "../content/structured-data";
import type { ValidationIssue, ValidationResult } from "../content/types";
import type { Json } from "../../types/database.types";

export const ARTICLE_BLOCK_TYPES = [
  "heading",
  "paragraph",
  "list",
  "comparison_table",
  "tip",
  "warning",
  "faq_group",
  "image",
  "related_content",
] as const;

export const ARTICLE_MINIMUM_WORD_COUNT = 900;

type ArticlePublicationData = {
  title: string | null;
  slug: string | null;
  summary: string | null;
  sections: Array<{ blockType: string; content: Json }>;
  slugAvailable: boolean;
};

export function validateArticleForPublication(data: ArticlePublicationData): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!data.title?.trim()) issues.push({ field: "title", code: "required", message: "Enter a title." });
  if (!data.summary?.trim()) issues.push({ field: "summary", code: "required", message: "Enter a summary." });
  issues.push(...validateContentSlug(data.slug));
  if (!data.slugAvailable) issues.push({ field: "slug", code: "conflict", message: "This article slug is already in use." });

  const meaningfulSection = data.sections.some((section) => {
    if (!ARTICLE_BLOCK_TYPES.includes(section.blockType as (typeof ARTICLE_BLOCK_TYPES)[number])) return false;
    return validateArticleBlockContent(section.blockType, section.content).valid;
  });

  if (!meaningfulSection) issues.push({ field: "sections", code: "minimum", message: "Add at least one content section." });

  const wordCount = countContentWords(
    data.sections
      .filter((section) => section.blockType !== "image")
      .map((section) => section.content),
  );
  if (wordCount < ARTICLE_MINIMUM_WORD_COUNT) {
    issues.push({
      field: "sections",
      code: "minimum_word_count",
      message: `Editorial articles require at least ${ARTICLE_MINIMUM_WORD_COUNT} words of substantive content. Current count: ${wordCount}.`,
    });
  }

  return issues.length === 0 ? { valid: true, issues: [] } : { valid: false, issues };
}

import type { Json } from "@/types/database.types";

import type { ValidationIssue, ValidationResult } from "./types";

export type TextContent = { text: string };
export type HeadingContent = { text: string; level: 2 | 3 | 4 };
export type ListContent = { items: string[]; ordered?: boolean };
export type TableContent = { headers: string[]; rows: string[][] };
export type FaqContent = { items: Array<{ question: string; answer: string }> };
export type ImageContent = { imageId: string };
export type RelatedContent = { title?: string; contentId: string; contentType: "article" | "care_guide" };

export function isJsonRecord(value: Json): value is { [key: string]: Json | undefined } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonBlank(value: Json | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validateTextBlock(content: Json) {
  return isJsonRecord(content) && nonBlank(content.text);
}

export function validateCareGuideSectionContent(sectionType: string, content: Json): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!validateTextBlock(content)) {
    issues.push({
      field: `sections.${sectionType}.content`,
      code: "format",
      message: "Care Guide sections require non-empty text content.",
    });
  }

  return issues.length === 0 ? { valid: true, issues: [] } : { valid: false, issues };
}

export function validateArticleBlockContent(blockType: string, content: Json): ValidationResult {
  const issues: ValidationIssue[] = [];
  const record = isJsonRecord(content) ? content : null;
  let valid = false;

  switch (blockType) {
    case "heading":
      valid = Boolean(record && nonBlank(record.text) && [2, 3, 4].includes(Number(record.level)));
      break;
    case "paragraph":
    case "tip":
    case "warning":
      valid = validateTextBlock(content);
      break;
    case "list":
      valid = Boolean(record && Array.isArray(record.items) && record.items.length > 0 && record.items.every(nonBlank));
      break;
    case "comparison_table":
      if (record && Array.isArray(record.headers) && Array.isArray(record.rows)) {
        const columnCount = record.headers.length;
        valid =
          columnCount > 0 &&
          record.headers.every(nonBlank) &&
          record.rows.length > 0 &&
          record.rows.every(
            (row) =>
              Array.isArray(row) &&
              row.length === columnCount &&
              row.every((cell) => typeof cell === "string"),
          );
      }
      break;
    case "faq_group":
      valid = Boolean(
        record &&
          Array.isArray(record.items) &&
          record.items.length > 0 &&
          record.items.every((item) => isJsonRecord(item) && nonBlank(item.question) && nonBlank(item.answer)),
      );
      break;
    case "image":
      valid = Boolean(record && nonBlank(record.imageId));
      break;
    case "related_content":
      valid = Boolean(
        record &&
          nonBlank(record.contentId) &&
          (record.contentType === "article" || record.contentType === "care_guide"),
      );
      break;
  }

  if (!valid) {
    issues.push({
      field: `sections.${blockType}.content`,
      code: "format",
      message: `The ${blockType.replaceAll("_", " ")} block is incomplete or malformed.`,
    });
  }

  return issues.length === 0 ? { valid: true, issues: [] } : { valid: false, issues };
}

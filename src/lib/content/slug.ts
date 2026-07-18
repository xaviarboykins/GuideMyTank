import type { ValidationIssue } from "./types";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "auth",
  "care-guides",
  "learning-center",
  "articles",
  "preview",
  "new",
  "edit",
]);

export function normalizeContentSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function validateContentSlug(value: string | null | undefined) {
  const issues: ValidationIssue[] = [];

  if (!value) {
    issues.push({ field: "slug", code: "required", message: "A slug is required to publish." });
    return issues;
  }

  if (!SLUG_PATTERN.test(value)) {
    issues.push({
      field: "slug",
      code: "format",
      message: "Use lowercase letters, numbers, and single hyphens only.",
    });
  }

  if (RESERVED_SLUGS.has(value)) {
    issues.push({ field: "slug", code: "reserved", message: "This slug is reserved by GuideMyTank." });
  }

  return issues;
}


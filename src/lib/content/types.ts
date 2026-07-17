export const CONTENT_STATUSES = ["draft", "published", "archived"] as const;

export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export type ValidationIssue = {
  field: string;
  code: string;
  message: string;
};

export type ValidationResult =
  | { valid: true; issues: [] }
  | { valid: false; issues: ValidationIssue[] };

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; message: string; issues?: ValidationIssue[] };


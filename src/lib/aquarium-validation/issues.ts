import { VALIDATION_SEVERITY_ORDER } from "./constants";
import type {
  AquariumValidationIssue,
  AquariumValidationSummary,
} from "./types";

type AquariumValidationIssueInput = Omit<
  AquariumValidationIssue,
  "id" | "affectedSpeciesIds"
> & {
  affectedSpeciesIds?: string[];
};

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
        .map(([key, nestedValue]) => [key, canonicalize(nestedValue)]),
    );
  }

  if (typeof value === "number" && !Number.isFinite(value)) {
    return String(value);
  }

  return value;
}

function stableSerialize(value: unknown) {
  return JSON.stringify(canonicalize(value)) ?? "undefined";
}

function hashKey(value: string) {
  let hash = 0x811c9dc5;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function normalizeAffectedSpeciesIds(speciesIds: string[]) {
  return Array.from(
    new Set(speciesIds.map((speciesId) => speciesId.trim()).filter(Boolean)),
  ).sort((speciesA, speciesB) => speciesA.localeCompare(speciesB));
}

export function getValidationIssueKey(
  issue: Pick<
    AquariumValidationIssue,
    "code" | "affectedSpeciesIds" | "metadata"
  >,
) {
  return [
    issue.code,
    normalizeAffectedSpeciesIds(issue.affectedSpeciesIds).join(","),
    stableSerialize(issue.metadata ?? {}),
  ].join("|");
}

export function createValidationIssue(
  issue: AquariumValidationIssueInput,
): AquariumValidationIssue {
  const normalizedIssue = {
    ...issue,
    affectedSpeciesIds: normalizeAffectedSpeciesIds(
      issue.affectedSpeciesIds ?? [],
    ),
  };
  const key = getValidationIssueKey(normalizedIssue);

  return {
    ...normalizedIssue,
    id: `validation-${hashKey(key)}`,
  };
}

export function deduplicateValidationIssues(
  issues: AquariumValidationIssue[],
) {
  const uniqueIssues = new Map<string, AquariumValidationIssue>();

  for (const issue of issues) {
    const normalizedIssue = createValidationIssue(issue);
    const key = getValidationIssueKey(normalizedIssue);

    if (!uniqueIssues.has(key)) {
      uniqueIssues.set(key, normalizedIssue);
    }
  }

  return Array.from(uniqueIssues.values());
}

export function sortValidationIssues(issues: AquariumValidationIssue[]) {
  return [...issues].sort((issueA, issueB) => {
    return (
      VALIDATION_SEVERITY_ORDER[issueA.severity] -
        VALIDATION_SEVERITY_ORDER[issueB.severity] ||
      issueA.category.localeCompare(issueB.category) ||
      issueA.code.localeCompare(issueB.code) ||
      issueA.title.localeCompare(issueB.title) ||
      issueA.affectedSpeciesIds
        .join(",")
        .localeCompare(issueB.affectedSpeciesIds.join(","))
    );
  });
}

export function summarizeValidationIssues(
  issues: AquariumValidationIssue[],
): AquariumValidationSummary {
  const summary: AquariumValidationSummary = {
    infoCount: 0,
    warningCount: 0,
    errorCount: 0,
    totalCount: issues.length,
  };

  for (const issue of issues) {
    if (issue.severity === "error") {
      summary.errorCount += 1;
    } else if (issue.severity === "warning") {
      summary.warningCount += 1;
    } else {
      summary.infoCount += 1;
    }
  }

  return summary;
}

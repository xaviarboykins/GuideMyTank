import { createHash } from "node:crypto";

import type { Json } from "@/types/database.types";

import type {
  GeneratedGuideDraft,
  GeneratedGuideSection,
  GuideRegenerationProposal,
  GuideRegenerationProposalDraft,
} from "./types";
import type { GuideSourceEntityInput } from "../types";

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, child]) => child !== undefined)
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
        .map(([key, child]) => [key, canonicalize(child)]),
    );
  }

  return value;
}

export function stableJson(value: unknown) {
  return JSON.stringify(canonicalize(value));
}

export function createDeterministicHash(value: unknown) {
  return createHash("sha256").update(stableJson(value)).digest("hex");
}

export function createGeneratedContentHash(
  draft: Pick<
    GeneratedGuideDraft,
    | "title"
    | "slug"
    | "summary"
    | "seoTitle"
    | "metaDescription"
    | "sections"
  >,
) {
  return createDeterministicHash(draft);
}

export function createPersistedContentHash(content: {
  title: string | null;
  slug: string | null;
  summary: string | null;
  seoTitle: string | null;
  metaDescription: string | null;
  sections: GeneratedGuideSection[];
}) {
  return createDeterministicHash(content);
}

export function createSourceDataFingerprint(
  sourceEntities: GuideSourceEntityInput[],
) {
  const normalized = sourceEntities
    .map((entity) => ({
      entityType: entity.entityType.trim().toLowerCase(),
      entityKey: entity.entityKey.trim().toLowerCase(),
      contributionRole: entity.contributionRole?.trim().toLowerCase() ?? "source",
      sourceVersion: entity.sourceVersion ?? null,
      sourceUpdatedAt: entity.sourceUpdatedAt ?? null,
      sourceFingerprint: entity.sourceFingerprint ?? null,
    }))
    .sort((a, b) =>
      `${a.entityType}:${a.entityKey}:${a.contributionRole}`.localeCompare(
        `${b.entityType}:${b.entityKey}:${b.contributionRole}`,
      ),
    );

  return createDeterministicHash(normalized);
}

export function getLatestSourceModifiedAt(
  sourceEntities: GuideSourceEntityInput[],
) {
  const timestamps = sourceEntities
    .map((entity) => entity.sourceUpdatedAt)
    .filter((value): value is string => {
      return typeof value === "string" && !Number.isNaN(Date.parse(value));
    })
    .map((value) => new Date(value).toISOString())
    .sort();

  return timestamps.at(-1) ?? null;
}

export function toJson(value: unknown) {
  return canonicalize(value) as Json;
}

export function createGuideRegenerationProposal(
  draft: GuideRegenerationProposalDraft,
  reason: string,
  generatedAt = new Date().toISOString(),
): GuideRegenerationProposal {
  return {
    version: 1,
    proposalHash: createDeterministicHash({ version: 1, draft }),
    generatedAt,
    reason,
    draft,
  };
}

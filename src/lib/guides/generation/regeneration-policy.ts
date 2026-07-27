export type ExistingGuideGenerationState = {
  status: string;
  manualEditsDetected: boolean;
  generatedContentHash: string | null;
  persistedContentHash: string;
};

export type GuideRegenerationDecision =
  | { allowed: true }
  | { allowed: false; reason: string };

export function decideGuideDraftRegeneration(
  state: ExistingGuideGenerationState,
): GuideRegenerationDecision {
  if (state.status === "published") {
    return {
      allowed: false,
      reason:
        "Published Guides cannot be regenerated in place. Create a proposal for editorial review.",
    };
  }

  if (state.status === "archived") {
    return {
      allowed: false,
      reason:
        "Archived Guides cannot be regenerated or restored automatically.",
    };
  }

  if (state.status !== "draft") {
    return {
      allowed: false,
      reason: "Only Draft Guides can be regenerated in place.",
    };
  }

  if (state.manualEditsDetected) {
    return {
      allowed: false,
      reason:
        "This Draft contains protected manual edits and requires editorial review.",
    };
  }

  if (
    state.generatedContentHash &&
    state.generatedContentHash !== state.persistedContentHash
  ) {
    return {
      allowed: false,
      reason:
        "The current Draft differs from its last generated snapshot and requires editorial review.",
    };
  }

  return { allowed: true };
}


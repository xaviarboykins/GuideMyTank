import type { InternalLinkItem } from "./types";

export interface LearningCenterLinkCandidate {
  id: string;
  slug: string | null;
  title: string | null;
  summary: string | null;
  content_type: string;
  published_at: string | null;
}

function pathFor(candidate: LearningCenterLinkCandidate) {
  if (!candidate.slug) return null;

  return candidate.content_type === "guide"
    ? `/learning-center/guides/${candidate.slug}`
    : `/learning-center/${candidate.slug}`;
}

export function buildLearningCenterFallbackLinks(
  currentId: string,
  candidates: LearningCenterLinkCandidate[],
): InternalLinkItem[] {
  const published = candidates
    .filter((candidate) => pathFor(candidate))
    .toSorted((a, b) => {
      const dateDifference = (b.published_at ?? "").localeCompare(
        a.published_at ?? "",
      );
      return dateDifference || a.id.localeCompare(b.id);
    });
  const currentIndex = published.findIndex((candidate) => candidate.id === currentId);

  if (currentIndex === -1 || published.length < 2) return [];

  const offsets = published.length === 2 ? [1] : [-1, 1];

  return offsets.flatMap((offset): InternalLinkItem[] => {
    const candidate = published[
      (currentIndex + offset + published.length) % published.length
    ];
    const href = pathFor(candidate);
    if (!href) return [];

    const entityType = candidate.content_type === "guide" ? "guide" : "article";
    return [{
      entityType,
      entityId: candidate.id,
      title: candidate.title ?? (entityType === "guide" ? "Aquarium Guide" : "Aquarium Article"),
      href,
      description: candidate.summary ?? undefined,
      relationship: "related-content",
      score: -1,
    }];
  });
}

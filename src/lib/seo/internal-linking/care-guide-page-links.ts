import { filterInternalLinkItems } from "./duplicate-filter";
import { resolveInternalLinkPath } from "./route-resolver";
import type { InternalLinkItem } from "./types";

interface CareGuideSpecies {
  id: string;
  slug: string;
  commonName: string;
  scientificName?: string | null;
}

interface RelatedCareGuide {
  id: string;
  slug: string | null;
  title: string | null;
  summary: string | null;
  species: {
    common_name: string;
  };
}

interface RelatedArticle {
  article_id: string;
  article: {
    slug: string | null;
    title: string | null;
    summary: string | null;
    status: string;
  };
}

export interface CareGuidePageLinkInput {
  guide: {
    id: string;
    slug: string;
  };
  species: CareGuideSpecies;
  relatedSpecies?: CareGuideSpecies[];
  relatedCareGuides?: RelatedCareGuide[];
  relatedArticles?: RelatedArticle[];
}

export interface CareGuidePageLinks {
  speciesProfile: InternalLinkItem[];
  relatedSpecies: InternalLinkItem[];
  compatibilityReports: InternalLinkItem[];
  relatedCareGuides: InternalLinkItem[];
  articles: InternalLinkItem[];
  builder: InternalLinkItem[];
}

function makeItem(
  item: Omit<InternalLinkItem, "href"> & { href: string | null },
): InternalLinkItem | null {
  return item.href ? { ...item, href: item.href } : null;
}

function excludeSeen(items: InternalLinkItem[], seen: Set<string>) {
  return items.filter((item) => {
    if (seen.has(item.href)) return false;
    seen.add(item.href);
    return true;
  });
}

export function buildCareGuidePageLinks({
  guide,
  species,
  relatedSpecies = [],
  relatedCareGuides = [],
  relatedArticles = [],
}: CareGuidePageLinkInput): CareGuidePageLinks {
  const source = {
    entityType: "care-guide" as const,
    entityId: guide.id,
    href: `/care-guides/${guide.slug}`,
  };
  const speciesProfile = [
    makeItem({
      entityType: "species",
      entityId: species.id,
      title: `${species.commonName} Species Profile`,
      href: resolveInternalLinkPath({
        entityType: "species",
        slug: species.slug,
      }),
      description:
        species.scientificName ??
        `View structured aquarium requirements for ${species.commonName}.`,
      relationship: "related-content",
    }),
  ].flatMap((item) => (item ? [item] : []));
  const relatedSpeciesLinks = relatedSpecies.flatMap((item) => {
    const link = makeItem({
      entityType: "species",
      entityId: item.id,
      title: item.commonName,
      href: resolveInternalLinkPath({
        entityType: "species",
        slug: item.slug,
      }),
      description: item.scientificName ?? undefined,
      relationship: "related-content",
    });
    return link ? [link] : [];
  });
  const compatibilityReports = relatedSpecies.flatMap((item) => {
    const link = makeItem({
      entityType: "compatibility-report",
      entityId: `${species.id}:${item.id}`,
      title: `${species.commonName} and ${item.commonName} Compatibility`,
      href: resolveInternalLinkPath({
        entityType: "compatibility-report",
        speciesASlug: species.slug,
        speciesBSlug: item.slug,
      }),
      description: `Research whether ${species.commonName} and ${item.commonName} can share an aquarium.`,
      relationship: "related-compatibility",
    });
    return link ? [link] : [];
  });
  const careGuideLinks = relatedCareGuides.flatMap((item) => {
    if (!item.slug) return [];
    const link = makeItem({
      entityType: "care-guide",
      entityId: item.id,
      title:
        item.title ?? `${item.species.common_name} Care Guide`,
      href: resolveInternalLinkPath({
        entityType: "care-guide",
        slug: item.slug,
      }),
      description: item.summary ?? undefined,
      relationship: "care-guide",
    });
    return link ? [link] : [];
  });
  const articleLinks = relatedArticles.flatMap((item) => {
    if (item.article.status !== "published" || !item.article.slug) return [];
    const link = makeItem({
      entityType: "article",
      entityId: item.article_id,
      title: item.article.title ?? "Aquarium Article",
      href: resolveInternalLinkPath({
        entityType: "article",
        slug: item.article.slug,
      }),
      description: item.article.summary ?? undefined,
      relationship: "related-content",
    });
    return link ? [link] : [];
  });
  const builder = [
    makeItem({
      entityType: "builder",
      entityId: "aquarium-builder",
      title: `Plan an aquarium for ${species.commonName}`,
      href: resolveInternalLinkPath({ entityType: "builder" }),
      description:
        "Add livestock and check tank size, stocking, and compatibility in one plan.",
      relationship: "builder-action",
    }),
  ].flatMap((item) => (item ? [item] : []));

  const seen = new Set<string>();
  const filter = (items: InternalLinkItem[], limit?: number) =>
    excludeSeen(
      filterInternalLinkItems(items, { source, limit }),
      seen,
    );

  return {
    speciesProfile: filter(speciesProfile, 1),
    relatedSpecies: filter(relatedSpeciesLinks, 4),
    compatibilityReports: filter(compatibilityReports, 4),
    relatedCareGuides: filter(careGuideLinks, 4),
    articles: filter(articleLinks, 4),
    builder: filter(builder, 1),
  };
}

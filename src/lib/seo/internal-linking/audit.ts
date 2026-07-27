export interface InternalLinkAuditSpecies {
  id: string;
  slug: string;
}

export interface InternalLinkAuditCareGuide {
  id: string;
  slug: string | null;
  status: string;
  species_id: string;
}

export interface InternalLinkAuditArticle {
  id: string;
  slug: string | null;
  status: string;
  content_type?: "article" | "guide" | string;
  include_products?: boolean;
  product_category?: string | null;
  generated_links?: string[];
}

export interface InternalLinkAuditInput {
  species: InternalLinkAuditSpecies[];
  careGuides: InternalLinkAuditCareGuide[];
  articles: InternalLinkAuditArticle[];
  careGuideRelatedSpecies: Array<{
    care_guide_id: string;
    species_id: string;
  }>;
  articleRelatedCareGuides: Array<{
    article_id: string;
    care_guide_id: string;
  }>;
  articleRelatedArticles: Array<{
    article_id: string;
    related_article_id: string;
  }>;
  topicClusters?: readonly {
    hub:
      | { entityType: "species"; slug: string }
      | { entityType: "article"; slug: string };
    species?: readonly { slug: string }[];
    articles?: readonly { slug: string }[];
    guides?: readonly { slug: string }[];
  }[];
}

export interface InternalLinkAuditPage {
  path: string;
  entityType:
    | "species"
    | "care-guide"
    | "article"
    | "guide"
    | "compatibility-report";
  entityId: string;
  indexable: boolean;
  links: string[];
}

export interface InternalLinkAuditIssue {
  severity: "error" | "warning";
  category:
    | "orphan_page"
    | "invalid_internal_target"
    | "duplicate_target"
    | "self_link"
    | "draft_or_archived_target"
    | "noncanonical_compatibility_url"
    | "missing_expected_compatibility_link";
  source: string;
  target?: string;
  description: string;
}

export interface InternalLinkAuditReport {
  generatedAt: string;
  summary: {
    pages: number;
    links: number;
    issues: number;
    errors: number;
    warnings: number;
    orphanedPages: number;
  };
  issues: InternalLinkAuditIssue[];
}

const VALID_PRODUCT_CATEGORIES = new Set([
  "tanks",
  "filters",
  "heaters",
  "lighting",
  "substrate",
  "decor",
]);

function pairPath(slugA: string, slugB: string) {
  const [speciesA, speciesB] = [slugA, slugB].sort();
  return `/compatibility/${speciesA}/${speciesB}`;
}

function isCanonicalCompatibilityPath(path: string) {
  const match = path.match(/^\/compatibility\/([^/]+)\/([^/]+)$/);
  return Boolean(match && match[1] < match[2]);
}

export function buildKnownInternalLinkPages(
  input: InternalLinkAuditInput,
): InternalLinkAuditPage[] {
  const speciesById = new Map(input.species.map((item) => [item.id, item]));
  const guidesById = new Map(input.careGuides.map((item) => [item.id, item]));
  const articlesById = new Map(input.articles.map((item) => [item.id, item]));
  const publishedGuides = input.careGuides.filter(
    (item) => item.status === "published" && item.slug,
  );
  const guideBySpeciesId = new Map(
    publishedGuides.map((guide) => [guide.species_id, guide]),
  );
  const pages: InternalLinkAuditPage[] = [];

  for (const current of input.species) {
    const links: string[] = ["/aquarium-builder"];
    const guide = guideBySpeciesId.get(current.id);
    if (guide?.slug) links.push(`/care-guides/${guide.slug}`);
    for (const other of input.species) {
      if (current.id !== other.id) {
        links.push(pairPath(current.slug, other.slug));
      }
    }
    pages.push({
      path: `/species/${current.slug}`,
      entityType: "species",
      entityId: current.id,
      indexable: true,
      links,
    });
  }

  for (let index = 0; index < input.species.length; index += 1) {
    for (let otherIndex = index + 1; otherIndex < input.species.length; otherIndex += 1) {
      const speciesA = input.species[index];
      const speciesB = input.species[otherIndex];
      const links = [
        `/species/${speciesA.slug}`,
        `/species/${speciesB.slug}`,
        "/aquarium-builder",
      ];
      for (const species of [speciesA, speciesB]) {
        const guide = guideBySpeciesId.get(species.id);
        if (guide?.slug) links.push(`/care-guides/${guide.slug}`);
      }
      pages.push({
        path: pairPath(speciesA.slug, speciesB.slug),
        entityType: "compatibility-report",
        entityId: `${speciesA.id}:${speciesB.id}`,
        indexable: true,
        links,
      });
    }
  }

  for (const guide of input.careGuides) {
    const currentSpecies = speciesById.get(guide.species_id);
    const links = currentSpecies
      ? [`/species/${currentSpecies.slug}`, "/aquarium-builder"]
      : [];
    for (const relation of input.careGuideRelatedSpecies) {
      if (relation.care_guide_id !== guide.id) continue;
      const related = speciesById.get(relation.species_id);
      if (!related) continue;
      links.push(`/species/${related.slug}`);
      if (currentSpecies) {
        links.push(pairPath(currentSpecies.slug, related.slug));
      }
      const relatedGuide = guideBySpeciesId.get(related.id);
      if (relatedGuide?.slug) links.push(`/care-guides/${relatedGuide.slug}`);
    }
    for (const relation of input.articleRelatedCareGuides) {
      if (relation.care_guide_id !== guide.id) continue;
      const article = articlesById.get(relation.article_id);
      if (article?.slug) links.push(`/learning-center/${article.slug}`);
    }
    pages.push({
      path: guide.slug ? `/care-guides/${guide.slug}` : `/care-guides/id/${guide.id}`,
      entityType: "care-guide",
      entityId: guide.id,
      indexable: guide.status === "published" && Boolean(guide.slug),
      links,
    });
  }

  for (const article of input.articles) {
    const links: string[] = [];
    const relatedSpecies: InternalLinkAuditSpecies[] = [];
    for (const relation of input.articleRelatedCareGuides) {
      if (relation.article_id !== article.id) continue;
      const guide = guidesById.get(relation.care_guide_id);
      if (!guide?.slug) continue;
      links.push(`/care-guides/${guide.slug}`);
      const species = speciesById.get(guide.species_id);
      if (species) {
        relatedSpecies.push(species);
        links.push(`/species/${species.slug}`);
      }
    }
    for (let index = 0; index < relatedSpecies.length; index += 1) {
      for (let otherIndex = index + 1; otherIndex < relatedSpecies.length; otherIndex += 1) {
        links.push(pairPath(relatedSpecies[index].slug, relatedSpecies[otherIndex].slug));
      }
    }
    for (const relation of input.articleRelatedArticles) {
      if (relation.article_id !== article.id) continue;
      const related = articlesById.get(relation.related_article_id);
      if (related?.slug) links.push(`/learning-center/${related.slug}`);
    }
    if (relatedSpecies.length) links.push("/aquarium-builder");
    if (
      article.include_products &&
      article.product_category &&
      VALID_PRODUCT_CATEGORIES.has(article.product_category)
    ) {
      links.push(`/aquarium-builder/products/${article.product_category}`);
    }
    links.push(...(article.generated_links ?? []));
    const isGuide = article.content_type === "guide";
    pages.push({
      path: article.slug
        ? isGuide
          ? `/learning-center/guides/${article.slug}`
          : `/learning-center/${article.slug}`
        : `/learning-center/id/${article.id}`,
      entityType: isGuide ? "guide" : "article",
      entityId: article.id,
      indexable: article.status === "published" && Boolean(article.slug),
      links,
    });
  }

  const pageMap = new Map(pages.map((page) => [page.path, page]));
  for (const cluster of input.topicClusters ?? []) {
    const hubPath =
      cluster.hub.entityType === "species"
        ? `/species/${cluster.hub.slug}`
        : `/learning-center/${cluster.hub.slug}`;
    const memberPaths = [
      ...(cluster.species?.map(
        (member) => `/species/${member.slug}`,
      ) ?? []),
      ...(cluster.articles?.map(
        (member) => `/learning-center/${member.slug}`,
      ) ?? []),
      ...(cluster.guides?.map(
        (member) => `/learning-center/guides/${member.slug}`,
      ) ?? []),
    ];
    const hubPage = pageMap.get(hubPath);
    if (hubPage) {
      for (const memberPath of memberPaths) {
        if (
          memberPath !== hubPath &&
          pageMap.has(memberPath) &&
          !hubPage.links.includes(memberPath)
        ) {
          hubPage.links.push(memberPath);
        }
      }
    }
    for (const memberPath of memberPaths) {
      if (memberPath === hubPath) continue;
      const memberPage = pageMap.get(memberPath);
      if (
        memberPage &&
        hubPage &&
        !memberPage.links.includes(hubPath)
      ) {
        memberPage.links.push(hubPath);
      }
    }
  }

  return pages;
}

export function auditInternalLinkPages(
  pages: InternalLinkAuditPage[],
): InternalLinkAuditReport {
  const issues: InternalLinkAuditIssue[] = [];
  const pageByPath = new Map(pages.map((page) => [page.path, page]));
  const validUtilityTargets = new Set([
    "/aquarium-builder",
    ...[...VALID_PRODUCT_CATEGORIES].map(
      (category) => `/aquarium-builder/products/${category}`,
    ),
  ]);
  const inbound = new Map(
    pages.filter((page) => page.indexable).map((page) => [page.path, 0]),
  );

  for (const page of pages.filter((item) => item.indexable)) {
    const targetCounts = new Map<string, number>();
    for (const target of page.links) {
      targetCounts.set(target, (targetCounts.get(target) ?? 0) + 1);
      if (target === page.path) {
        issues.push({
          severity: "error",
          category: "self_link",
          source: page.path,
          target,
          description: "Generated recommendations include the current page.",
        });
      }
      const targetPage = pageByPath.get(target);
      if (!targetPage && !validUtilityTargets.has(target)) {
        issues.push({
          severity: "error",
          category: "invalid_internal_target",
          source: page.path,
          target,
          description: "Generated link target is not a known public entity.",
        });
      } else if (targetPage && !targetPage.indexable) {
        issues.push({
          severity: "error",
          category: "draft_or_archived_target",
          source: page.path,
          target,
          description: "Generated link points to draft or archived content.",
        });
      } else if (targetPage?.indexable) {
        inbound.set(target, (inbound.get(target) ?? 0) + 1);
      }
      if (
        target.startsWith("/compatibility/") &&
        !isCanonicalCompatibilityPath(target)
      ) {
        issues.push({
          severity: "error",
          category: "noncanonical_compatibility_url",
          source: page.path,
          target,
          description: "Compatibility target does not use canonical pair ordering.",
        });
      }
    }
    for (const [target, count] of targetCounts) {
      if (count > 1) {
        issues.push({
          severity: "warning",
          category: "duplicate_target",
          source: page.path,
          target,
          description: `The page generated the same target ${count} times.`,
        });
      }
    }
    if (page.entityType === "species") {
      const expectedReports = pages.filter(
        (candidate) =>
          candidate.entityType === "compatibility-report" &&
          candidate.entityId.split(":").includes(page.entityId),
      );
      for (const report of expectedReports) {
        if (!page.links.includes(report.path)) {
          issues.push({
            severity: "error",
            category: "missing_expected_compatibility_link",
            source: page.path,
            target: report.path,
            description: "Species page is missing an expected Compatibility report link.",
          });
        }
      }
    }
  }

  for (const [path, count] of inbound) {
    if (count === 0) {
      issues.push({
        severity: "warning",
        category: "orphan_page",
        source: path,
        description: "Published indexable page has no contextual inbound link.",
      });
    }
  }

  const errors = issues.filter((item) => item.severity === "error").length;
  return {
    generatedAt: new Date().toISOString(),
    summary: {
      pages: pages.filter((page) => page.indexable).length,
      links: pages
        .filter((page) => page.indexable)
        .reduce((total, page) => total + page.links.length, 0),
      issues: issues.length,
      errors,
      warnings: issues.length - errors,
      orphanedPages: issues.filter((item) => item.category === "orphan_page").length,
    },
    issues,
  };
}

export function generateInternalLinkAudit(
  input: InternalLinkAuditInput,
): InternalLinkAuditReport {
  return auditInternalLinkPages(buildKnownInternalLinkPages(input));
}

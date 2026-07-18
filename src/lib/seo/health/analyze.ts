import { getSiteOrigin } from "../site-url";
import type { SeoHealthImage, SeoHealthIssue, SeoHealthPage } from "./types";

function issue(
  severity: SeoHealthIssue["severity"],
  category: string,
  urlOrRecord: string,
  description: string,
  suggestedAction: string,
): SeoHealthIssue {
  return { severity, category, urlOrRecord, description, suggestedAction };
}

export function analyzeSeoPages(pages: SeoHealthPage[]) {
  const issues: SeoHealthIssue[] = [];
  const knownPaths = new Set(pages.map((page) => page.path));
  const inboundLinks = new Map(pages.map((page) => [page.path, 0]));
  const canonicals = new Map<string, string[]>();

  for (const page of pages) {
    if (!page.indexable) continue;

    if (!page.title?.trim()) {
      issues.push(issue("error", "missing_title", page.path, "Indexable page is missing a title.", "Add intent-aligned metadata."));
    }
    if (!page.description?.trim()) {
      issues.push(issue("error", "missing_description", page.path, "Indexable page is missing a description.", "Add a factual meta description."));
    }
    if (!page.canonical) {
      issues.push(issue("error", "missing_canonical", page.path, "Indexable page is missing a canonical URL.", "Generate a canonical with the shared metadata helper."));
    } else {
      if (!page.canonical.startsWith(getSiteOrigin())) {
        issues.push(issue("error", "canonical_hostname", page.path, `Canonical does not use ${getSiteOrigin()}.`, "Normalize it with the site URL utility."));
      }
      canonicals.set(page.canonical, [...(canonicals.get(page.canonical) ?? []), page.path]);
    }

    for (const link of page.links) {
      if (!link.startsWith("/")) continue;
      const target = link.split(/[?#]/, 1)[0];
      if (!knownPaths.has(target)) {
        issues.push(issue("error", "broken_internal_link", page.path, `Internal link target does not exist: ${target}`, "Correct or remove the link."));
      } else {
        inboundLinks.set(target, (inboundLinks.get(target) ?? 0) + 1);
      }
    }
  }

  for (const [canonical, paths] of canonicals) {
    if (paths.length > 1) {
      issues.push(issue("error", "duplicate_canonical", canonical, `Canonical is shared by ${paths.join(", ")}.`, "Choose one canonical route and redirect or noindex aliases."));
    }
  }

  for (const page of pages) {
    if (page.indexable && page.path !== "/" && (inboundLinks.get(page.path) ?? 0) === 0) {
      issues.push(issue("warning", "orphan_page", page.path, "Indexable page has no known crawlable internal link.", "Add a relevant server-rendered link from another public page."));
    }
    if (!page.indexable && page.inSitemap) {
      issues.push(issue("error", "nonindexable_in_sitemap", page.path, "Nonindexable page appears in a sitemap.", "Remove it from sitemap generation."));
    }
  }

  return issues;
}

export function analyzeSeoImages(images: SeoHealthImage[]) {
  return images.flatMap((image): SeoHealthIssue[] => {
    const issues: SeoHealthIssue[] = [];
    if (!image.width || !image.height) {
      issues.push(issue("warning", "missing_image_dimensions", image.storagePath, "Content image is missing width or height metadata.", "Populate intrinsic image dimensions during upload or metadata repair."));
    }
    if (!image.altText?.trim()) {
      issues.push(issue("warning", "missing_image_alt", image.storagePath, "Content image is missing alt text.", "Add concise descriptive alt text, or mark it decorative at render time."));
    }
    return issues;
  });
}

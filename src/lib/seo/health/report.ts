import "server-only";

import { assertAdmin } from "@/lib/auth/admin";
import {
  generateCanonicalCompatibilityPairBatch,
  getCanonicalCompatibilityPairCount,
  isCanonicalCompatibilityPair,
} from "@/lib/compatibility/urls";
import { createClient } from "@/lib/supabase/server";

import { getSiteUrl } from "../site-url";
import { COMPATIBILITY_SITEMAP_BATCH_SIZE } from "../sitemaps";
import { analyzeSeoImages, analyzeSeoPages } from "./analyze";
import type { SeoHealthPage, SeoHealthReport } from "./types";

const STATIC_PAGES = [
  ["/", "Homepage", "Aquarium planning tools and freshwater species data."],
  ["/piscidex", "PisciDex Freshwater Fish Species Database", "Browse freshwater aquarium species data."],
  ["/species", "Freshwater Fish Species Index", "Browse freshwater aquarium species profiles."],
  ["/care-guides", "Freshwater Fish Care Guides", "Browse published freshwater fish Care Guides."],
  ["/compatibility", "Aquarium Tank Mate Compatibility Checker", "Compare aquarium species compatibility."],
  ["/compatibility/disclaimer", "Compatibility Disclaimer", "How to use compatibility scores responsibly."],
  ["/aquarium-builder", "Aquarium Builder", "Plan a freshwater aquarium build."],
  ["/products", "Aquarium Product Catalog", "Browse aquarium equipment and supplies."],
  ["/learning-center", "Aquarium Learning Center", "Browse freshwater aquarium education."],
  ["/about", "About GuideMyTank", "Learn about GuideMyTank."],
  ["/contact", "Contact GuideMyTank", "Contact GuideMyTank."],
  ["/privacy", "Privacy Policy", "GuideMyTank privacy policy."],
  ["/terms", "Terms of Service", "GuideMyTank terms of service."],
  ["/affiliate-disclosure", "Affiliate Disclosure", "GuideMyTank affiliate disclosure."],
  ["/disclaimer", "Disclaimer", "GuideMyTank aquarium information disclaimer."],
] as const;

function countByFamily(pages: SeoHealthPage[], sitemapOnly = false) {
  return pages.reduce<Record<string, number>>((counts, page) => {
    if (!page.indexable || (sitemapOnly && !page.inSitemap)) return counts;
    counts[page.family] = (counts[page.family] ?? 0) + 1;
    return counts;
  }, {});
}

export async function generateSeoHealthReport(): Promise<SeoHealthReport> {
  await assertAdmin();
  const supabase = await createClient();
  const [speciesResult, guidesResult, articlesResult, imagesResult] = await Promise.all([
    supabase.from("species").select("slug,common_name,summary").order("slug"),
    supabase.from("care_guides").select("id,title,slug,summary,meta_description,canonical_url,status"),
    supabase.from("articles").select("id,title,slug,summary,meta_description,canonical_url,status"),
    supabase.from("content_images").select("id,storage_path,alt_text,width,height"),
  ]);

  const databaseError = speciesResult.error ?? guidesResult.error ?? articlesResult.error ?? imagesResult.error;
  if (databaseError) throw new Error(`Unable to generate SEO health report: ${databaseError.message}`);

  const species = speciesResult.data ?? [];
  const guides = guidesResult.data ?? [];
  const articles = articlesResult.data ?? [];
  const publishedGuides = guides.filter((item) => item.status === "published" && item.slug);
  const publishedArticles = articles.filter((item) => item.status === "published" && item.slug);
  const directoryLinks = [
    ...STATIC_PAGES.map(([path]) => path),
    ...species.map((item) => `/species/${item.slug}`),
    ...publishedGuides.map((item) => `/care-guides/${item.slug}`),
    ...publishedArticles.map((item) => `/learning-center/${item.slug}`),
  ];

  const pages: SeoHealthPage[] = STATIC_PAGES.map(([path, title, description]) => ({
    path,
    family: "static",
    title,
    description,
    canonical: getSiteUrl(path),
    indexable: true,
    inSitemap: true,
    links: path === "/" ? directoryLinks.filter((item) => item !== "/") : ["/"],
  }));

  pages.push(...species.map((item) => ({
    path: `/species/${item.slug}`,
    family: "species",
    title: `${item.common_name} Species Profile and Care Data | GuideMyTank`,
    description: item.summary ?? `Aquarium species data for ${item.common_name}.`,
    canonical: getSiteUrl(`/species/${item.slug}`),
    indexable: true,
    inSitemap: true,
    links: ["/species", "/piscidex", "/compatibility"],
  })));

  pages.push(...guides.map((item) => {
    const published = item.status === "published" && Boolean(item.slug);
    return {
      path: item.slug ? `/care-guides/${item.slug}` : `/admin/care-guides/${item.id}`,
      family: "care-guides",
      title: item.title,
      description: item.meta_description ?? item.summary,
      canonical: item.slug ? getSiteUrl(`/care-guides/${item.slug}`) : null,
      indexable: published,
      inSitemap: published,
      links: published ? ["/care-guides", "/species"] : [],
    };
  }));

  pages.push(...articles.map((item) => {
    const published = item.status === "published" && Boolean(item.slug);
    return {
      path: item.slug ? `/learning-center/${item.slug}` : `/admin/articles/${item.id}`,
      family: "articles",
      title: item.title,
      description: item.meta_description ?? item.summary,
      canonical: item.slug ? getSiteUrl(`/learning-center/${item.slug}`) : null,
      indexable: published,
      inSitemap: published,
      links: published ? ["/learning-center", "/care-guides"] : [],
    };
  }));

  const issues = [
    ...analyzeSeoPages(pages),
    ...analyzeSeoImages((imagesResult.data ?? []).map((image) => ({
      id: image.id,
      storagePath: image.storage_path,
      altText: image.alt_text,
      width: image.width,
      height: image.height,
    }))),
  ];

  for (const item of guides) {
    if (!item.slug || !item.canonical_url) continue;
    const expected = getSiteUrl(`/care-guides/${item.slug}`);
    if (item.canonical_url !== expected) {
      issues.push({ severity: "warning", category: "stored_canonical_mismatch", urlOrRecord: item.id, description: `Stored canonical ${item.canonical_url} differs from emitted canonical ${expected}.`, suggestedAction: "Clear or update the legacy CMS canonical value." });
    }
  }
  for (const item of articles) {
    if (!item.slug || !item.canonical_url) continue;
    const expected = getSiteUrl(`/learning-center/${item.slug}`);
    if (item.canonical_url !== expected) {
      issues.push({ severity: "warning", category: "stored_canonical_mismatch", urlOrRecord: item.id, description: `Stored canonical ${item.canonical_url} differs from emitted canonical ${expected}.`, suggestedAction: "Clear or update the legacy CMS canonical value." });
    }
  }

  const compatibilityCount = getCanonicalCompatibilityPairCount(species.length);
  let invalidCompatibilityPairs = 0;
  for (let offset = 0; offset < compatibilityCount; offset += COMPATIBILITY_SITEMAP_BATCH_SIZE) {
    const pairs = generateCanonicalCompatibilityPairBatch(species, offset, COMPATIBILITY_SITEMAP_BATCH_SIZE);
    invalidCompatibilityPairs += pairs.filter((pair) => !isCanonicalCompatibilityPair(pair.speciesA, pair.speciesB)).length;
  }
  if (invalidCompatibilityPairs) {
    issues.push({ severity: "error", category: "noncanonical_compatibility_pair", urlOrRecord: "compatibility sitemap", description: `${invalidCompatibilityPairs} noncanonical pairs were generated.`, suggestedAction: "Repair pair ordering before publishing the sitemap." });
  }
  if (compatibilityCount) {
    issues.push({ severity: "warning", category: "compatibility_internal_links", urlOrRecord: "/compatibility/*", description: `${compatibilityCount} compatibility reports rely primarily on sitemap discovery; complete crawlable pair-directory linking does not exist.`, suggestedAction: "Address through the deferred Related Compatibility Engine or another useful server-rendered relationship system." });
  }

  const pageFamilies = countByFamily(pages);
  pageFamilies.compatibility = compatibilityCount;
  const sitemapFamilies = countByFamily(pages, true);
  sitemapFamilies.compatibility = compatibilityCount;
  const totalIndexablePages = Object.values(pageFamilies).reduce((sum, count) => sum + count, 0);
  const totalSitemapUrls = Object.values(sitemapFamilies).reduce((sum, count) => sum + count, 0);
  const errors = issues.filter((item) => item.severity === "error").length;

  return {
    generatedAt: new Date().toISOString(),
    summary: { totalIndexablePages, totalSitemapUrls, totalIssues: issues.length, errors, warnings: issues.length - errors },
    pageFamilies,
    sitemapFamilies,
    issues,
  };
}

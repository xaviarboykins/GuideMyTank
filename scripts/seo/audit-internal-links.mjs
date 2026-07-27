import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

import { createClient } from "@supabase/supabase-js";

import { generateInternalLinkAudit } from "../../src/lib/seo/internal-linking/audit.ts";
import { topicClusters } from "../../src/lib/seo/internal-linking/topic-clusters.ts";

const require = createRequire(import.meta.url);
const { loadLocalEnv } = require("../load_env_file.cjs");
const root = process.cwd();
loadLocalEnv(root);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL and a Supabase key are required.",
  );
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const [
  speciesResult,
  guidesResult,
  articlesResult,
  guideMetadataResult,
  guideSpeciesResult,
  articleGuidesResult,
  articleArticlesResult,
] = await Promise.all([
  supabase.from("species").select("id,slug").order("slug"),
  supabase.from("care_guides").select("id,slug,status,species_id"),
  supabase
    .from("articles")
    .select("id,slug,status,content_type,include_products,product_category"),
  supabase
    .from("programmatic_guide_metadata")
    .select("article_id,generation_metadata"),
  supabase
    .from("care_guide_related_species")
    .select("care_guide_id,species_id"),
  supabase
    .from("article_related_care_guides")
    .select("article_id,care_guide_id"),
  supabase
    .from("article_related_articles")
    .select("article_id,related_article_id"),
]);

const error =
  speciesResult.error ??
  guidesResult.error ??
  articlesResult.error ??
  guideMetadataResult.error ??
  guideSpeciesResult.error ??
  articleGuidesResult.error ??
  articleArticlesResult.error;

if (error) {
  throw new Error(`Unable to load internal-link audit data: ${error.message}`);
}

const guideMetadata = new Map(
  (guideMetadataResult.data ?? []).map((item) => [
    item.article_id,
    item.generation_metadata,
  ]),
);

function generatedLinks(articleId) {
  const metadata = guideMetadata.get(articleId);
  if (
    !metadata ||
    typeof metadata !== "object" ||
    !Array.isArray(metadata.internalLinks)
  ) {
    return [];
  }

  return metadata.internalLinks.flatMap((item) =>
    item &&
    typeof item === "object" &&
    typeof item.href === "string" &&
    item.href.startsWith("/")
      ? [item.href]
      : [],
  );
}

const report = generateInternalLinkAudit({
  species: speciesResult.data ?? [],
  careGuides: guidesResult.data ?? [],
  articles: (articlesResult.data ?? []).map((article) => ({
    ...article,
    generated_links: generatedLinks(article.id),
  })),
  careGuideRelatedSpecies: guideSpeciesResult.data ?? [],
  articleRelatedCareGuides: articleGuidesResult.data ?? [],
  articleRelatedArticles: articleArticlesResult.data ?? [],
  topicClusters,
});
const reportDirectory = path.join(root, "reports", "seo");
const reportPath = path.join(reportDirectory, "internal-links.json");
fs.mkdirSync(reportDirectory, { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

console.log("GuideMyTank internal-link audit");
console.log(`Pages: ${report.summary.pages}`);
console.log(`Generated links: ${report.summary.links}`);
console.log(`Issues: ${report.summary.issues}`);
console.log(`Errors: ${report.summary.errors}`);
console.log(`Warnings: ${report.summary.warnings}`);
console.log(`Orphaned pages: ${report.summary.orphanedPages}`);
console.log(`JSON report: ${reportPath}`);

if (report.summary.errors > 0) {
  process.exitCode = 1;
}

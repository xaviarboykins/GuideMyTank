# SEO Utilities reporting

The protected `/admin/seo` page generates an SEO health report from the application route model and Supabase content state. `/admin/seo/report` returns the same report as authenticated JSON with private, no-store caching.

No Search Console credentials, production crawl, or paid SEO service is required.

## Checks

- Broken known internal links
- Orphan indexable pages in the modeled crawl graph
- Preferred-host canonical mismatches
- Duplicate canonicals
- Missing titles, descriptions, and canonicals
- Nonindexable pages included in the modeled sitemap inventory
- Legacy CMS canonical values that differ from emitted canonicals
- Canonical compatibility-pair ordering
- Compatibility page-family internal-link coverage
- Duplicate and self-generated contextual links
- Draft or archived contextual targets
- Missing expected Species-to-Compatibility links
- Missing content-image dimensions
- Missing content-image alt text
- Indexable page counts by family
- Sitemap URL counts by family

Draft and archived sitemap leakage is represented by the general nonindexable-in-sitemap check. The report builds sitemap eligibility from publication status, so correctly excluded records do not generate findings.

## Scope and limitations

The report validates application and database facts; it does not claim that Google crawled or indexed a URL. It does not execute browser rendering, validate external links, inspect HTTP response chains, measure Core Web Vitals, or replace Search Console URL Inspection.

Compatibility reports are checked without crawling deployed HTML. The modeled
graph includes canonical reports, Species accordion links, participant links,
and available Care Guides. Husbandry classifications belong to the separate
planned Compatibility Engine Audit.

Run the local internal-link report with `npm run seo:audit-links`. It writes
`reports/seo/internal-links.json`, which is ignored by Git.

Run the report after content publishing, sitemap changes, route migrations, or canonical changes. Treat errors as release blockers when they represent sitemap leakage, missing canonical metadata, duplicate canonical URLs, or broken internal links.

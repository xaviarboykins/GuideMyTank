# SEO health reporting

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
- Missing content-image dimensions
- Missing content-image alt text
- Indexable page counts by family
- Sitemap URL counts by family

Draft and archived sitemap leakage is represented by the general nonindexable-in-sitemap check. The report builds sitemap eligibility from publication status, so correctly excluded records do not generate findings.

## Scope and limitations

The report validates application and database facts; it does not claim that Google crawled or indexed a URL. It does not execute browser rendering, validate external links, inspect HTTP response chains, measure Core Web Vitals, or replace Search Console URL Inspection.

Compatibility reports are checked in 10,000-pair batches without crawling or loading page content. Because the complete compatibility page family does not have complete server-rendered relationship links, the report emits one aggregate warning rather than thousands of repetitive orphan-page warnings.

Run the report after content publishing, sitemap changes, route migrations, or canonical changes. Treat errors as release blockers when they represent sitemap leakage, missing canonical metadata, duplicate canonical URLs, or broken internal links.

# Technical SEO audit — Milestone 7

## Outcome

Milestone 7 established a measurable, scalable technical SEO baseline without adding programmatic content, advertising, affiliate recommendations, or a new structured-data framework.

## Implemented architecture

- Centralized production origin and absolute URL construction
- HTTPS `www` canonical enforcement and apex redirect fallback
- Canonical metadata on public page families
- Permanent canonical redirects for legacy species aliases and reversed compatibility pairs
- Route-family sitemaps with 10,000-URL compatibility batching
- Published-only Care Guide and article sitemap inclusion
- Accurate database-backed `lastModified` values where available
- Shared metadata and indexability helpers
- Noindex handling for drafts, previews, filters, placeholders, Builder workflows, PDFs, and API responses
- Crawlable breadcrumbs for species, compatibility, Care Guide, and article detail pages
- Protected repeatable SEO health reporting and authenticated JSON output
- Search Console baseline documentation without raw exports or credentials

## Final validation

Representative desktop and mobile rendering was checked for:

- Homepage
- PisciDex
- Species detail
- Compatibility Checker
- Compatibility report
- Care Guide
- Learning Center article
- Aquarium Builder
- Product catalog
- Protected admin SEO route

Validated behavior included titles, descriptions, canonicals, robots metadata, visible headings, breadcrumbs, filtered-page noindex output, compatibility ordering redirects, responsive overflow, sitemap counts, PDF/API `X-Robots-Tag` headers, and admin noindex behavior.

Final local sitemap counts at the time of validation:

| Sitemap | URLs |
| --- | ---: |
| Static | 15 |
| Species | 100 |
| Care Guides | 1 |
| Articles | 1 |
| Compatibility batch 0 | 4,950 |
| Total | 5,067 |

The final route check found and fixed a collision where compatibility proxy canonicalization intercepted `/compatibility/sitemap/0.xml`. The sitemap now returns HTTP 200 with all 4,950 canonical pair URLs.

## Current health baseline

The authenticated SEO health report returned:

- 5,067 indexable pages
- 5,067 sitemap URLs
- 0 errors
- 13 warnings

The observed warnings are maintenance opportunities such as missing stored content-image dimensions, plus the known aggregate compatibility internal-link limitation. They are not evidence of Google indexing status.

## Manual production requirements

- Set `www.guidemytank.com` as the primary Vercel production domain.
- Configure `guidemytank.com` to redirect directly to the `www` HTTPS origin.
- Verify the redirect is one hop and does not create HTTP → apex HTTPS → `www` chains.
- Submit or refresh the advertised sitemap URLs in the `www` Search Console property.
- Monitor canonical selection and exclusion reasons after deployment.

## Remaining risks

- Compatibility reports are discovered primarily through sitemaps; complete useful relationship linking is deferred.
- Compatibility pair volume grows quadratically and also affects build-time static generation independently of sitemap batching.
- Many content images use raw `<img>` rendering; missing intrinsic dimensions remain a layout-shift risk where CSS does not reserve space.
- Desktop organic underperformance has not been causally diagnosed.
- CMS legacy canonical fields remain stored even though emitted canonicals are normalized.
- Live DNS/Vercel redirect behavior must be verified after deployment.
- Sitemap inclusion does not guarantee Google indexing.

## Deferred work

- Topic Cluster Engine
- Related Species Engine
- Related Compatibility Engine
- Programmatic content generation
- Full structured-data framework
- Search Console API integration
- AdSense and affiliate monetization
- Microsoft Clarity, scheduled as a Milestone 10 improvement
- Full performance or Builder architecture rewrites

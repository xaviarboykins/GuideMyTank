# Google Search Console baseline — July 2026

This baseline records the latest 28-day Google Search Console summary supplied for Milestone 7. The raw export is intentionally not committed because it may contain user-specific query and property data.

## Supplied Search Console findings

| Metric | Latest 28 days |
| --- | ---: |
| Clicks | Approximately 28 |
| Impressions | Approximately 3,256 |
| CTR | Approximately 0.86% |
| Average position | Approximately 24 |

Additional supplied observations:

- Mobile organic performance is significantly stronger than desktop.
- Compatibility reports are the strongest organic page family.
- Multiple compatibility reports rank near or on page one.
- Species pages generally rank substantially lower.
- Both `www.guidemytank.com` and `guidemytank.com` URLs appeared in the export.

These observations are the measurement baseline, not independently recalculated repository facts.

## Repository-confirmed findings

The Milestone 7 repository audit confirmed that:

- Production URL generation had been distributed across multiple files before Phase 2.
- Before the legacy route was removed, both `/piscidex/[slug]` and
  `/species/[slug]` rendered species details while the latter was canonical.
- Internal PisciDex links previously favored the noncanonical alias.
- The original sitemap regenerated current timestamps for unchanged URLs.
- Compatibility reports represent the largest page family by a wide margin.
- Species and Care Guide titles previously overlapped in search intent.

Phases 2–5 centralized the preferred `www` origin, redirected aliases, split and corrected sitemaps, standardized indexability, and differentiated metadata intent.

## Hypotheses requiring more Search Console data

The following are hypotheses, not confirmed causes:

- Hostname and alias consolidation may improve crawl efficiency and canonical selection.
- Species-page title differentiation and internal canonical links may improve species visibility.
- Desktop underperformance may reflect rendering, Core Web Vitals, snippet behavior, search intent, device-specific ranking differences, or the query mix.
- Some “not indexed” URLs may be duplicates, filtered variants, placeholders, low-value combinations, recently discovered pages, or pages Google has crawled but chosen not to index.
- Compatibility reports may outperform species pages because their queries have clearer intent and lower competition.

Future comparisons should segment by page family, device, hostname, query, country, and index coverage reason. Do not attribute movement to a single technical change without sufficient comparison data.

## Measurement cadence

Use consistent rolling 28-day comparisons and record:

- Clicks, impressions, CTR, and average position
- Mobile versus desktop performance
- Page-family performance
- Near-page-one queries and pages
- Canonical hostname observations
- Indexed versus submitted URL counts
- Search Console exclusion reasons

Microsoft Clarity remains deferred to Milestone 10.

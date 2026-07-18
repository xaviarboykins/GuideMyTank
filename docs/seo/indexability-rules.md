# Indexability rules

GuideMyTank uses page metadata or `X-Robots-Tag` as the primary indexability control. `robots.txt` provides crawler guidance but is not used as a substitute for `noindex`.

| Surface | Indexability | Discovery behavior |
| --- | --- | --- |
| Published public pages | Index, follow | Eligible for canonical sitemaps |
| Unfiltered public directories | Index, follow | Self-canonical |
| Search and filter query variants | Noindex, follow, noarchive | Canonicalize to the unfiltered directory |
| Compatibility report pages | Index, follow | Only canonical species ordering is included in sitemaps |
| Compatibility Checker with selected-species query parameters | Noindex, follow, noarchive | Canonicalize to `/compatibility` |
| Main Aquarium Builder | Index, follow | Public tool landing/workspace |
| Builder livestock, plant, and product-selection workflows | Noindex, follow, noarchive | Excluded from sitemaps |
| Published Care Guides and articles | Index, follow | Published-only services and sitemaps |
| Care Guide “coming soon” placeholders | Noindex, follow, noarchive | Excluded from sitemaps |
| Drafts and previews | Noindex, nofollow, noarchive | Protected under `/admin` and excluded from sitemaps |
| Admin and authentication | Noindex, nofollow | Authentication protected; crawler-disallowed |
| API routes | `X-Robots-Tag: noindex, noarchive` | Crawler-disallowed |
| Care Guide PDFs | `X-Robots-Tag: noindex, noarchive` | Publicly accessible but excluded from sitemaps |
| Missing public records | 404 | `notFound()`; not included in sitemaps |
| Archived articles | 404 unless a later lifecycle rule provides a replacement | Published queries exclude archived records |
| Archived Care Guides | Noindex placeholder when the underlying species exists; otherwise 404 | Excluded from sitemaps |
| Legacy `/piscidex/[slug]` routes | Permanent redirect | Canonical target is `/species/[slug]` |

## Search variants

The shared `src/lib/seo/indexability.ts` helper treats any non-empty query parameter as a search/filter variant. This prevents arbitrary query combinations and empty-result pages from becoming indexable while allowing crawlers to follow result links.

The affected public directories are PisciDex, Care Guides, Learning Center, Products, and the Compatibility Checker workflow.

## Empty states

Unfiltered directories may remain indexable when the database contains no published records because they are legitimate stable directory routes. Query-driven empty results are noindexed through the search-variant rule. Content placeholders are noindexed explicitly.

## Removal lifecycle

Use a 301/308 redirect when removed content has a clear permanent replacement. Use 404 for genuinely missing or removed content without a replacement. Introduce 410 only for a deliberate, documented removal policy; no current route requires it.

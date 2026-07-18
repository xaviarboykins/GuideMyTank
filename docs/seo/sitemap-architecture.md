# Sitemap architecture

GuideMyTank uses Next.js metadata sitemap routes rather than custom XML generation.

## Current sitemap set

| Sitemap | Content |
| --- | --- |
| `/sitemap.xml` | Canonical static pages and public tool/category pages |
| `/species/sitemap.xml` | Canonical species detail pages |
| `/care-guides/sitemap.xml` | Published Care Guides only |
| `/learning-center/sitemap.xml` | Published educational articles only |
| `/compatibility/sitemap/[id].xml` | Canonically ordered compatibility pairs, batched at 10,000 URLs |

`robots.txt` lists every active sitemap. Compatibility sitemap URLs are derived from the current species count, so new batches are advertised automatically.

## Index decision

The current site has roughly 5,000 sitemap URLs, well below the 50,000 URL and 50 MB limits for an individual sitemap. A custom sitemap index is not needed now. Google supports submitting multiple sitemap files, and listing each sitemap in `robots.txt` keeps the implementation within Next.js conventions.

Introduce a sitemap index only if operational needs make a single submission preferable or the number of family/batch files becomes difficult to manage. Do not replace the framework metadata routes merely to create an index early.

## Inclusion rules

- Emit only the preferred `https://www.guidemytank.com` hostname in production.
- Include canonical public pages only.
- Exclude admin, auth, API, preview, PDF, draft, archived, missing, placeholder Care Guide, query-string, and legacy alias URLs.
- Include Care Guides and articles only through services filtered to `status = published`.
- Include each pair of two distinct species once, ordered by slug.
- `/piscidex/[slug]` is excluded because it redirects to `/species/[slug]`.
- The product catalog currently has no public product-detail route. `/products` and canonical Aquarium Builder product-category routes remain in the static sitemap.

## Dates and optional fields

`lastModified` is emitted only when an authoritative database value exists:

- Species use `species.updated_at` when present.
- Care Guides use `care_guides.updated_at`.
- Articles use `articles.updated_at`.
- Static and compatibility URLs omit the field because the repository does not currently have a reliable per-URL modification timestamp.

The sitemaps omit `priority` and `changeFrequency`; GuideMyTank does not have evidence-based values for those optional hints.

## Scaling behavior

Compatibility pair count grows as `n × (n - 1) / 2`. Sitemap generation selects only the requested 10,000-pair window rather than materializing all pairs in a single sitemap response. Each output remains comfortably below search-engine limits.

Application static generation still prebuilds all compatibility reports. That build-time behavior is separate from sitemap memory usage and may need its own scaling decision in a future milestone.

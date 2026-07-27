# GuideMyTank SEO architecture

GuideMyTank's SEO foundation prioritizes canonical, server-rendered, crawlable utility and educational pages. This directory documents the Milestone 7 technical baseline and operating rules.

## Core rules

- Preferred production origin: `https://www.guidemytank.com`
- Canonical detail route for species: `/species/[slug]`
- Legacy `/piscidex/[slug]` requests permanently redirect to the species route.
- Compatibility pairs are ordered alphabetically by slug; reversed pairs permanently redirect.
- Public published content is indexable. Drafts, previews, placeholders, personalized Builder workflows, and filtered query variants are noindexed.
- Sitemaps contain canonical, indexable, published URLs only.
- Absolute application URLs must use `src/lib/seo/site-url.ts`.
- Principal metadata generation uses `src/lib/seo/metadata.ts`.
- Robots/indexability decisions use `src/lib/seo/indexability.ts`.

## Sitemap endpoints

- `/sitemap.xml`
- `/species/sitemap.xml`
- `/care-guides/sitemap.xml`
- `/learning-center/sitemap.xml`
- `/compatibility/sitemap/[id].xml`

The compatibility family is batched at 10,000 URLs using Next.js `generateSitemaps`. `robots.txt` advertises every active batch.

## Validation

Run the repository's actual checks:

```bash
npm run lint
npm test
npm run seo:validate-schema
npm run build
npm run seo:audit-links
```

There is no dedicated `typecheck` package script. During development, TypeScript can be checked with the installed compiler; the production build also performs TypeScript validation.

Authenticated administrators can run the database-backed SEO health report at `/admin/seo` and retrieve JSON from `/admin/seo/report`.

See `internal-linking.md` for contextual relationship rules, topic-cluster
maintenance, and the local audit.

## Documents

- `canonical-host.md` — origin, redirects, and Vercel configuration
- `sitemap-architecture.md` — sitemap grouping and batching
- `indexability-rules.md` — index/noindex and lifecycle policy
- `metadata-conventions.md` — titles, descriptions, social metadata, and breadcrumbs
- `structured-data-framework.md` — schema graphs, identities, validation, and extension rules
- `seo-health-reporting.md` — repeatable report checks and limitations
- `search-console-baseline-2026-07.md` — supplied measurement baseline
- `technical-seo-audit.md` — implemented architecture, validation, risks, and deferred work
- `evergreen-content-launch.md` — controlled publishing, pilot manifest,
  production verification, and 30-/60-/90-day monitoring

# Internal linking and topic clusters

GuideMyTank uses a small server-rendered internal-linking domain instead of a
database-backed recommendation graph. Relationships come from existing species,
Compatibility, Care Guide, Article, Builder, and product-category data plus a
typed topic-cluster configuration.

## Architecture

The core domain lives in `src/lib/seo/internal-linking`.

- `types.ts` defines link entities, relationships, and page identities.
- `route-resolver.ts` is the central route builder and uses canonical
  Compatibility pair ordering.
- `duplicate-filter.ts` removes invalid paths, self-links, and repeated targets.
- `related-species.ts` and `scoring.ts` calculate structured-data similarity.
- `related-compatibility.ts` selects canonical reports and prevents reversed
  pair duplicates.
- `related-content.ts` uses explicit relationships without semantic search.
- `topic-clusters.ts` contains manually maintained definitions.
- `topic-cluster-service.ts` matches pages, resolves hubs, and filters members.
- `*-page-links.ts` files compose page-specific sections.
- `service.ts` performs focused server-side queries for those composers.
- `audit.ts` builds and analyzes the known contextual link graph.

Shared components under `src/components/internal-linking` receive resolved data
as props. They do not query Supabase, do not render when empty, and use standard
server-rendered Next.js links.

## Relationship rules

Compatibility reports link to both Species profiles, available Care Guides,
canonical related reports, matching cluster hubs, and Aquarium Builder. Product
promotion is intentionally absent.

Species pages retain the complete Compatibility accordion and add similar
Species, configured Articles, matching cluster hubs, and a Builder action.
Common Tank Mates, Species to Avoid, and Similar Care Requirements panels were
removed because compatibility quality needs a dedicated audit.

Care Guides link to their Species profile, manually related Species, neutral
Compatibility research, related published Care Guides, curated Articles, and
Aquarium Builder.

Articles use editor-curated Care Guides and Articles. Relevant Species derive
from those Care Guides. Compatibility research appears only with two or more
such Species. A Product Category link appears only when an editor explicitly
enables it and selects one supported category.

No link panels were added inside Aquarium Builder. Product Category integration
is deferred until individual Product pages or a deeper catalog justify it.

## Topic clusters

Clusters are typed code configuration, not CMS records. Each definition has a
unique slug, title, description, canonical hub, and supported members.

The Betta Compatibility cluster is intentionally narrow. Popular Freshwater
Fish uses the `Most Popular Freshwater Aquarium Fish in 2026` Article as its
hub and connects the ten Species covered by that guide. Mentioning Betta does
not make that Article a Betta Compatibility resource.

### Adding a cluster

1. Choose one existing, indexable canonical hub.
2. Add a typed definition to `topic-clusters.ts`.
3. List only published, genuinely supporting members.
4. Add Compatibility participant slugs only when their reports belong.
5. Add Product Categories only when contextually useful.
6. Update `topic-cluster-service.test.ts`.
7. Run TypeScript, tests, and `npm run seo:audit-links`.
8. Verify the hub does not recommend itself and members link back to the hub.

Do not infer membership merely because an Article mentions one Species. Do not
parse Article prose or generate membership automatically.

## Internal-link audit

Run:

```bash
npm run seo:audit-links
```

The command writes `reports/seo/internal-links.json`, which is ignored by Git.
The authenticated `/admin/seo` SEO Utilities page includes the same summary and
findings.

The audit detects contextual orphans, invalid targets, duplicate targets,
self-links, draft or archived targets, noncanonical Compatibility URLs, and
missing expected Species-to-Compatibility links.

An orphan is a published, indexable entity page with no meaningful inbound
relationship in this system. Global navigation, footer, breadcrumbs, legal
routes, admin pages, and sitemap discovery do not satisfy this definition.

## Known limitations and future work

- Topic clusters require code changes.
- Article-to-Species relationships derive from curated Care Guides.
- The audit models known entities; it does not crawl deployed HTML.
- Compatibility link correctness is not husbandry classification correctness.
- Builder and Product Category pages have no inbound-content panels by design.
- The Related Species scorer is deliberately simple and request-focused.

A later Compatibility Engine Audit will calculate every canonical pair, compare
results with overrides, flag suspicious classifications, check
dropdown/database/route consistency, and produce a reviewable report.

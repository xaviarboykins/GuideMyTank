# Caching and revalidation

GuideMyTank treats public database content as evergreen reference material.
Pages remain statically rendered with long safety revalidation windows, while
admin mutations use targeted on-demand invalidation for normal freshness.

## Rendering policy

| Family | Rendering | Fallback TTL | Build behavior |
| --- | --- | ---: | --- |
| Homepage | Static ISR | 6 hours | One page |
| Learning Center indexes | Static ISR | 6 hours | One page per index |
| Species index, detail, PisciDex | Static ISR | 7 days | Species details are eagerly generated because the set is small |
| Compatibility index and detail | Static ISR | 30 days | Details are generated on first request, not as a full matrix |
| Care Guide index and detail | Static ISR | 7 days | Existing species/guide slugs are generated; new valid slugs can render on demand |
| Article and programmatic Guide detail | Static ISR | 7 days | Generated on demand |
| Product index and builder categories | Static ISR | 7 days | Fixed builder categories are generated |
| Sitemap routes | Static ISR | 24 hours | Generated independently |
| Admin and preview routes | Request time | None | `force-dynamic`; authenticated data never enters public caches |

The canonical constants live in `src/lib/cache/policy.ts`. Next.js requires
route-segment config to be a literal, so each `revalidate` export mirrors its
named policy value and includes the policy name in a comment. Update both
together; do not add an unexplained TTL.

## Mutation-to-invalidation mapping

The path builders and server invalidation functions live in
`src/lib/cache/revalidation.ts`.

| Mutation | Invalidated public paths |
| --- | --- |
| Care Guide publish/archive/slug change | Old and new detail paths, Care Guide index, Learning Center, homepage, Care Guide sitemap |
| Article publish/archive/slug change | Old and new detail paths, Learning Center indexes, homepage, Learning Center sitemap |
| Programmatic Guide publish/archive/slug change | Old and new Guide paths, Learning Center indexes, homepage, Learning Center sitemap |
| Species change | Species detail/index, PisciDex, compatibility hub, species sitemap, explicitly supplied affected pairs and dependent Guides |
| Compatibility source change | One canonical pair, both species pages, compatibility hub |
| Product change | Product index, supplied detail/category paths, root sitemap only when public inventory changes |

Draft-only edits do not require public invalidation. Publishing, archiving,
restoring, deleting public content, or changing its public slug does.

### Compatibility pairs

`getCompatibilityPath()` sorts the two species slugs. Callers may supply either
orientation; only the canonical route is invalidated. Reverse routes continue
to permanently redirect. A species mutation must enumerate only the other
species whose visible pair reports are affected. Do not invalidate the dynamic
compatibility route family.

The compatibility sitemap still exposes every valid canonical pair, but the
pages are no longer all rendered during deployment. A crawler or visitor causes
a valid pair to be statically generated on first request and it then uses the
30-day safety TTL.

## Sitemap behavior

Sitemaps contain public canonical URLs only. Species `lastModified` comes from
`updated_at`; editorial `lastModified` comes from the published record. The
compatibility sitemap does not invent timestamps for deterministic pairs.

Care Guide and Learning Center sitemaps use a 24-hour fallback instead of
request-time rendering. Publish/archive and slug changes invalidate the
applicable sitemap immediately, so additions and removals do not wait for the
fallback.

## Metadata and structured data

Detail routes wrap their primary entity loader with React `cache()`. Metadata
and the page body therefore share the same result during a render, so canonical,
Open Graph, visible content, and JSON-LD cannot observe separate database reads.
This is request memoization, not a durable cross-request cache.

## Preview behavior

Admin layouts and preview pages remain `force-dynamic` and use the authenticated
Supabase server client. They show current draft data and do not populate or
invalidate public caches until a public-state mutation occurs.

## Adding a page family

1. Decide whether the content is public and evergreen. Prefer static rendering.
2. Add a named TTL to `CACHE_TTL`; choose a long safety fallback.
3. Add pure path mapping and a targeted invalidation wrapper.
4. Wire every mutation that changes visible content or URL inventory.
5. Cover old and new slugs, publication/removal, indexes, and sitemaps.
6. Memoize a loader when metadata and page rendering read the same entity.
7. Add tests for path scope and run lint, TypeScript, tests, and a build.

Never use `revalidatePath("/", "layout")` for an entity mutation. Never
invalidate every compatibility report because one pair changed. Do not convert
an evergreen public route to request-time rendering to avoid ISR writes.

## Future affiliate product data

Cache durable catalog fields and editorial recommendations for seven days with
targeted invalidation. Treat volatile price or availability data separately:
do not shorten every product page's ISR window for a frequently changing field.
Prefer a small cached data boundary or client-side retailer lookup, subject to
affiliate terms. Affiliate URL changes should invalidate only the affected
product and recommendation pages. Inventory or slug changes must also refresh
the sitemap.

## Operational checklist

- Confirm a mutation calls the matching targeted helper.
- For slug changes, invalidate both the prior and current path.
- For publish/unpublish/archive/delete, update the relevant sitemap.
- For species changes, identify affected pairs and generated Guides explicitly.
- Verify previews remain dynamic and public pages remain static in build output.
- After deployment, watch Vercel ISR Writes, cache hit rate, build duration, and
  compatibility first-request latency.
- Compare writes per day before and after at least one crawler cycle and one
  editorial publish cycle.
- Investigate any return toward thousands of writes per deployment before
  expanding sitemaps.

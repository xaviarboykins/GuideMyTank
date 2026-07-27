# Metadata and structured-data framework

GuideMyTank uses a small typed SEO framework built around page types that exist
in the application. It is not intended to model all of Schema.org.

## Architecture

- `src/lib/seo/site-url.ts` — production canonical URLs
- `src/lib/seo/metadata.ts` — Next.js metadata construction
- `src/lib/seo/indexability.ts` — robots and publication-state rules
- `src/lib/seo/identities.ts` — stable schema entity IDs
- `src/lib/seo/breadcrumbs.ts` — visible and structured breadcrumbs
- `src/lib/seo/schema/builders.ts` — typed entity builders
- `src/lib/seo/schema/graph.ts` — graph composition and conflict detection
- `src/lib/seo/schema/serialize.ts` — safe JSON serialization
- `src/lib/seo/schema/*-page.ts` — small page-family composers
- `src/components/seo/json-ld.tsx` — server-compatible rendering

Routes load data and determine what is visible. They pass explicit values to
pure metadata and schema functions.

## Canonical URLs

Canonical URLs always use `https://www.guidemytank.com`. Development, previews,
and environment variables cannot change canonical identity. Canonicals omit
query strings, fragments, and trailing slashes.

Compatibility pairs reuse `src/lib/compatibility/urls.ts` and are sorted by
slug. Programmatic Guides preserve the existing routes:

```text
/learning-center/guides
/learning-center/guides/[slug]
```

## Metadata

`buildPageMetadata` produces branded titles, descriptions, absolute canonicals,
robots directives, Open Graph data, Twitter cards, Article dates, optional
publisher metadata, and optional stable images.

Expiring signed URLs must not be used for social metadata. An unavailable image
or alt value causes image metadata to be omitted.

## Stable identities

Global identities:

```text
https://www.guidemytank.com/#organization
https://www.guidemytank.com/#website
```

Page entities use `{canonical}#webpage`, `#article`, `#breadcrumbs`, `#faq`, and
`#itemlist`. Species subjects use:

```text
https://www.guidemytank.com/species/{slug}#species
```

## Organization and WebSite

One Organization and one WebSite are composed into each migrated public graph.
The WebSite references the Organization as publisher. Unverified people,
addresses, contacts, social accounts, awards, reviews, and ratings are omitted.

The root layout emits no separate JSON-LD script, preventing layout/page
duplication.

## Graph composition and rendering

The composer flattens inputs, removes omitted entities, preserves deterministic
order, deduplicates identical IDs, reports conflicting IDs, and omits empty
graphs.

`src/components/seo/json-ld.tsx` is the only renderer. Serialization escapes
`<`, `>`, `&`, and Unicode line and paragraph separators. Empty or conflicting
graphs render nothing.

## Breadcrumbs

Visible breadcrumbs and BreadcrumbList use the same data:

```ts
[
  { name: "Home", path: "/" },
  { name: "Learning Center", path: "/learning-center" },
]
```

The visible component leaves the current page unlinked. Structured conversion
makes URLs absolute and assigns positions beginning at one.

## Article-based pages

Editorial Articles, Programmatic Guides, and published Care Guides share
`buildArticlePageEntities`. It may compose Organization, WebSite, WebPage,
Article, BreadcrumbList, and eligible FAQPage entities.

Headline and description come from visible content. Dates appear only when
available. Categories and tags may provide `articleSection` and `keywords`.
Guide generation remains independent; a future Guide family does not need a
new schema builder if its page remains Article-based.

## Compatibility Reports and Species

Compatibility Reports use WebPage rather than Article. Each graph includes two
conservative Species subjects and one canonical page identity. Reversed pairs
produce the same identity. FAQPage is omitted because the current page does not
display the complete FAQ questions and answers.

Species pages use WebPage plus a conservative `Thing` subject. Missing facts
are omitted. Real local Species images may be used in social metadata; the
generic placeholder is not presented as a Species image.

## Collections and ItemList

CollectionPage is used for the Learning Center and its Article and Guide
listings. ItemList is limited to visible cards on canonical, unfiltered Article
and Guide listings.

Search, filter, family, and pagination variants are noindex and emit no
collection graph. ItemList is not automatically added to related links,
recommendations, or every card layout.

## FAQ eligibility

FAQPage requires visible, structured, nonblank questions and full answers. The
builder removes duplicate normalized questions and omits an empty FAQPage.

Care Guide FAQ prose is parsed for display by legacy UI code, so it is not
eligible for FAQ schema.

## Indexing and sitemaps

Published public content is indexable. Drafts, archived content, previews,
missing records, and query variants follow `indexability-rules.md`.

Published-only repositories prevent unpublished graphs from being composed.
The validator rejects Article and FAQPage entities when a fixture is marked
nonindexable. Sitemaps use the canonical URL utility and published-only data.

## Validation

Run:

```bash
npm run seo:validate-schema
```

Fixtures cover Homepage, Article, Programmatic Guide, Care Guide, Species,
Compatibility in both pair orders, Guide listing, and unsafe serialization.

Validation checks IDs, references, absolute URLs, duplicate IDs, breadcrumb
positions, ItemList ordering and counts, FAQ completeness, and unpublished
Article/FAQ behavior. It is focused application validation, not a complete
Schema.org validator or a guarantee of rich results.

## Adding a page type

1. Confirm indexability and the stable canonical route.
2. Reuse an existing page composer when its semantics match.
3. Add a narrow entity builder only when necessary.
4. Derive schema from visible server-rendered content.
5. Add composition and validation fixtures.
6. Change sitemaps only for a new canonical public route.

## Testing

```bash
npm test
npm run seo:validate-schema
npx tsc --noEmit
npm run lint
```

Production builds are run by the project owner.

## Known limitations

- No stable general-purpose social image exists.
- Signed content images are not stable schema images.
- ImageObject is deferred until stable public content-image URLs are available.
- Care Guide FAQ schema is omitted.
- Product Category schema is deferred because no public category route exists.
- Species and Care Guide indexes do not emit ItemList.
- Local validation does not replace external search-engine testing tools.

## Out of scope

The framework does not generate or publish content, guarantee rich results,
fabricate people or organization facts, create review/rating data, model
Product offers, monitor production schema, or integrate Search Console.

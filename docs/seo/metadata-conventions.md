# Metadata and breadcrumb conventions

GuideMyTank's principal public page families use `src/lib/seo/metadata.ts` to produce consistent titles, descriptions, canonical URLs, Open Graph metadata, Twitter cards, and robots directives.

## Titles

- Pass a concise intent-focused title to `buildPageMetadata`.
- The helper appends `| GuideMyTank` exactly once.
- Species profiles use `{Common Name} Species Profile and Care Data`.
- Published Care Guides use `{Common Name} Care Guide` or their reviewed CMS SEO title.
- Compatibility reports use `Can {Species A} Live With {Species B}? Compatibility Guide`.
- Articles use their reviewed CMS SEO title when present, otherwise their public article title.
- Avoid keyword lists, repeated brand names, and titles that make two page families indistinguishable.

## Descriptions

- Describe the visible page and its primary search intent in natural language.
- Species pages use the reviewed species summary when available.
- Compatibility descriptions name both species and qualify the result as a GuideMyTank rating rather than a guarantee.
- Articles and Care Guides prefer reviewed CMS meta descriptions, then their summaries, then a factual fallback.

## URLs and social metadata

- Canonical and Open Graph URLs must match and use the central site URL utility.
- Public canonicals exclude query parameters and fragments.
- Open Graph and Twitter titles/descriptions match the primary metadata.
- The default Twitter card is `summary` until a stable public social-image system exists.
- Do not use expiring signed content-image URLs as social preview images.

## Breadcrumbs

Visible breadcrumbs use the shared `ContentBreadcrumbs` component and real Next.js links. The final item represents the current page and is not linked.

Current detail hierarchies:

- Home → Species → Species name
- Home → Compatibility → Species A and Species B
- Home → Care Guides → Care Guide title
- Home → Learning Center → Article title

Existing JSON-LD breadcrumbs remain in place. Broader structured-data consolidation is deferred to the structured-data milestone.

## Non-public and missing content

Missing records use standardized noindex metadata before the route renders `notFound()`. Drafts, previews, archived content, placeholders, and search variants follow the rules in `indexability-rules.md`.

# Evergreen content launch

## Scope

GuideMyTank launches evergreen content gradually through the existing Admin
Portal. Programmatic Guides reuse the Article editor and publishing lifecycle;
Care Guides and editorial Articles retain their existing workflows. Species,
Plants, and Products continue to use their script-driven data pipelines.

This process does not require a campaign database, automatic publishing,
Search Console API integration, or a separate SEO dashboard.

## Current pilot manifest

| Field | Value |
| --- | --- |
| Topic cluster | Betta Compatibility |
| Page family | Programmatic Guide |
| Guide family | Species comparison |
| Title | Betta vs Guppy |
| Canonical path | `/learning-center/guides/betta-splendens-vs-guppy` |
| Generation key | `comparison:betta-splendens-guppy` |
| Publication status | Published |
| Editorial status | Published before this launch checklist; re-review required |
| Supporting Species | Betta, Guppy |
| Supporting Care Guides | Betta Splendens Care Guide |
| Supporting Compatibility report | Betta and Guppy Compatibility |
| Sitemap status | Eligible in the Learning Center sitemap; verify in production |
| Indexing status | Unverified |
| Search Console status | Manual URL Inspection required |
| 30-/60-/90-day status | Not started |

Add future rows only after a candidate is approved. A Markdown table is
sufficient until launch volume creates a demonstrated need for persistent
campaign tracking.

## Candidate selection

Use a simple evidence rubric:

- **High:** supported by Search Console demand, complete structured data,
  strong supporting content, and low overlap risk.
- **Medium:** useful and data-complete but missing demand evidence or supporting
  Care Guides.
- **Low:** weak demand, limited internal-link opportunity, or high editorial
  effort.
- **Blocked:** incomplete source data, weak compatibility confidence, unsafe
  stocking inference, duplicate intent, or a publication-validation error.

Do not calculate a numeric score when query-level Search Console evidence is
absent. Search demand never overrides data quality or editorial usefulness.

## Repeatable workflow

1. Review current Search Console queries and landing pages.
2. Confirm that an existing page does not already satisfy the intent.
3. Generate or edit a Draft through the Admin Portal.
4. Review accuracy, uncertainty language, repetition, sources, images, FAQs,
   metadata, and internal relationships.
5. Resolve all blocking Guide validation errors.
6. Preview on narrow and desktop widths.
7. Publish one approved page manually.
8. Verify the production URL, canonical, robots output, JSON-LD, visible links,
   sitemap entry, and GA4 page view.
9. Inspect the URL manually in Search Console and record the result.
10. Wait for evidence before expanding the batch.

Generated Guide relationship suggestions are exposed publicly only for
Published Guides and pass through the shared internal-link filter. Generation
records and source fingerprints remain admin-only.

## Editorial checklist

- The page answers one distinct search intent without competing with an
  existing GuideMyTank URL.
- Statements are supported by structured data or assigned sources.
- Compatibility language communicates uncertainty and does not guarantee a
  complete stocking plan.
- Tank-size guidance accounts for social groups and stocking constraints, not
  only a species' minimum tank-size field.
- The introduction, tables, lists, warnings, and FAQs are useful and not
  repetitive.
- Images have descriptive alt text and appropriate attribution.
- Links resolve to Published canonical targets without self-links or reversed
  Compatibility pairs.
- Title, description, canonical, social metadata, visible FAQ, and JSON-LD
  agree with the rendered page.
- The page works with keyboard navigation and at narrow mobile widths.

## Production verification

For every publication, record:

- HTTP status and final URL
- Declared canonical
- Robots directive
- Title and description
- Open Graph and Twitter output
- Article, Breadcrumb, and visible FAQ schema parity
- Images and internal relationships
- Sitemap presence
- GA4 page view and `page_family`
- Mobile overflow, hydration, and console errors

Draft and Archived routes must remain unavailable and absent from sitemaps.

## Search Console record

| Field | Value |
| --- | --- |
| Inspection date | |
| URL | |
| User-declared canonical | |
| Google-selected canonical | |
| Crawl allowed | |
| Indexing allowed | |
| Indexing requested | |
| Indexed | Unverified |
| Result or exclusion reason | |
| Notes | |

Never mark a URL indexed without a verified Google result.

## Monitoring

Use consistent rolling 28-day comparisons.

| Review | Indexing and canonical | Impressions / clicks / CTR / position | Top queries | GA4 landing sessions | Builder or Compatibility navigation | Action |
| --- | --- | --- | --- | --- | --- | --- |
| Baseline | | | | | | |
| 30 days | | | | | | Fix technical issues; avoid premature rewrites |
| 60 days | | | | | | Improve weak snippets and genuine content gaps |
| 90 days | | | | | | Expand, improve, consolidate, or hold |

## Optimization backlog

Create items only from observed evidence.

| URL | Page family | Cluster | Query | Evidence | Problem | Recommended action | Impact | Effort | Priority | Owner | Status | Review date |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

Valid actions include metadata improvement, internal linking, content
correction, cannibalization review, indexing repair, accessibility or mobile
repair, and a genuinely missing supporting Guide.

## Future monetization

Do not add ads or affiliate links during this launch. Future placements must
preserve layout stability, keep disclosures clear, separate editorial and
commercial claims, and avoid interrupting Aquarium Builder workflows. Product
links should remain contextual and use verified product data.

## Responsibility boundary

Codex can implement and test repository changes, generate approved Drafts, and
prepare validation reports. The project owner approves editorial content,
publishes through the portal, runs production builds, verifies deployed pages
and analytics, and performs Search Console URL Inspection.

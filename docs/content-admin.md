# GuideMyTank Content Administration

## Architecture

Milestone 6 uses separate Care Guide and Article workflows. Both use Supabase
PostgreSQL, server-side services, shared content image/source records, and
database-enforced publication rules.

### Core tables

- `care_guides` belongs to exactly one existing `species` record. Its slug is
  unique and its `quick_facts` value is structured JSON.
- `care_guide_sections`, `care_guide_images`, `care_guide_sources`, and
  `care_guide_related_species` store ordered guide relationships.
- `articles` has a unique slug and does not require an image.
- `article_sections` stores ordered typed content blocks.
- `article_categories`, `article_tags`, and their assignment tables classify
  articles.
- `article_images`, `article_sources`, `article_related_articles`, and
  `article_related_care_guides` store ordered article relationships.
- `content_images` stores metadata for images uploaded to the private
  `content-images` bucket. Care Guide images are separate from species images.
- `sources` is reusable across both content types.

The schema is defined by the `2026071701` through `20260717023` migrations.
Generated application types live in `src/types/database.types.ts`.

## Authorization

Admin access is based on `auth.users.raw_app_meta_data.role = "admin"`. The
database helper `public.is_admin()` is used by RLS policies, while
`src/lib/auth/admin.ts` protects server-rendered admin routes and write actions.
Do not place the role in user-editable metadata.

Anonymous access is limited to rows attached to content whose status is
`published`. Draft and archived content is not publicly readable. Storage
objects in `content-images` follow the same published-content rule.

To grant the role to an existing Supabase Auth user, use the Supabase dashboard
or a trusted server-side administrative operation to set app metadata to:

```json
{ "role": "admin" }
```

## Publishing workflows

Content progresses through `draft`, `published`, and `archived`. Drafts may be
incomplete and can be deleted. Published content and its attached assets are
immutable; archive it before returning it to draft for editing. Archived rows
are not treated as published.

Care Guide publication requires:

- an existing species relationship;
- a title, unique slug, and summary;
- all required quick facts;
- all required structured sections with content;
- at least two Care Guide-specific images, including one primary image;
- at least one source;
- valid related-species and image relationships.

Article publication requires a title, unique slug, summary, and at least one
valid ordered section. Images are optional.

The TypeScript validators provide actionable admin errors. PostgreSQL triggers
enforce the same security-critical rules even when a write bypasses the UI.

## Admin routes

- `/auth/login` — internal admin sign-in.
- `/admin` — protected dashboard.
- `/admin/content` — content overview.
- `/admin/care-guides` and `/admin/care-guides/new` — guide list and creation.
- `/admin/care-guides/[id]` — guide editor.
- `/admin/care-guides/[id]/preview` — protected, non-indexable draft preview.
- `/admin/articles` and `/admin/articles/new` — article list and creation.
- `/admin/articles/[id]` — article editor.
- `/admin/articles/[id]/preview` — protected, non-indexable draft preview.
- `/admin/categories`, `/admin/tags`, `/admin/images`, and `/admin/sources` —
  supporting content management.

## Images and sources

The `content-images` bucket is reserved for Article and Care Guide uploads.
Database metadata is deleted only when an image is unused; storage deletion and
metadata deletion are handled together by the admin action. Sources can be
searched, reused, edited, and deleted only when no content relationship uses
them. Published-content asset metadata is protected by database triggers.

## Verification

Run the database verification from a configured local checkout:

```powershell
node scripts/verify_content_admin.cjs
```

The script uses uniquely named temporary records, verifies RLS and publication
constraints against the configured Supabase project, and removes those records
afterward. It requires the existing Supabase variables in `.env.local` and must
never print their values.

Run the existing repository checks:

```powershell
npx tsc --noEmit
npm test
npm run lint
npm run validate:compatibility
npm run validate:expert-overrides
npm run validate:species
npm run validate:species-sources
npm run build
```

There is no `typecheck` npm script, so TypeScript is invoked directly. The build
is intentionally run separately because this project generates more than 5,000
pages.

### Manual release checklist

- Confirm a non-admin is redirected from `/admin` to `/auth/login` and cannot
  invoke admin write actions.
- Confirm an admin can sign in, use every admin route, and sign out.
- Create an incomplete Care Guide draft and verify its preview is protected and
  marked non-indexable.
- Search and associate an existing species; save facts, ordered sections,
  sources, related species, and two distinct Care Guide images.
- Confirm an invalid guide shows actionable errors and a valid guide publishes.
- Create and publish an Article without images; then verify categories, tags,
  ordered sections, optional images, and sources.
- Verify duplicate slugs are rejected and published content can be archived.
- Confirm only published Care Guides appear on the public index and sitemap.
- Smoke-test Species pages, Piscidex, Aquarium Builder, compatibility tools,
  product pages, and existing image URLs.

## Public content

Published Care Guides appear under `/care-guides`, and published Articles appear
under `/learning-center`. Both content types have public detail routes and
sitemap entries. RLS prevents draft and archived records from appearing in
these queries even if a public URL is requested directly.

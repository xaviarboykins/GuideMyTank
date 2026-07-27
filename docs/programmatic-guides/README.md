# Programmatic Guide Engine

## Purpose

Programmatic Guides are deterministic, search-focused aquarium resources built
from GuideMyTank structured data. They are not Care Guides and do not use
AI-generated prose.

The first supported families are:

- Species comparisons
- Tank-mate and avoid-with Guides
- Tank-size general and community Guides

## Content architecture

Guides reuse `articles` as the publishable content entity. The
`articles.content_type` discriminator separates `article` and `guide` records.
This preserves the existing editor, sections, images, sources, categories,
tags, relationships, validation presentation, and publishing lifecycle.

Guide-only state is stored in:

- `programmatic_guide_metadata`
- `programmatic_guide_source_entities`

Care Guides remain independent in `care_guides`.

The schema was introduced by:

- `20260726010000_add_programmatic_guide_foundation.sql`
- `20260726020000_add_programmatic_guide_draft_persistence.sql`
- `20260726030000_add_programmatic_guide_regeneration_application.sql`

## Routes

| Content | Browse route | Detail route |
| --- | --- | --- |
| Articles | `/learning-center/articles` | `/learning-center/[slug]` |
| Guides | `/learning-center/guides` | `/learning-center/guides/[slug]` |
| Care Guides | `/care-guides` | `/care-guides/[slug]` |

Only Published Guides resolve publicly or enter the sitemap. Draft and Archived
Guides return not found and remain non-indexable.

## Generation identity

Every Guide has a normalized, unique generation key:

- `comparison:betta-gourami`
- `tank-mates:betta`
- `avoid-with:angelfish`
- `tank-size:20-gallon`
- `tank-size:40-gallon-community`

Comparison keys sort their species identities, so reversing the input cannot
create another record. PostgreSQL unique constraints protect generation keys
and normalized primary search intents during concurrent requests.

## Generation workflow

Generators live under `src/lib/guides/` and implement the shared generator
contract in `generation/types.ts`.

Each family:

1. Loads existing structured species, compatibility, stocking, tank-size,
   product, Care Guide, and reference data as applicable.
2. Produces deterministic metadata and Article-compatible sections.
3. Records contributing source entities and their versions, timestamps, or
   fingerprints.
4. Creates a Draft or safely regenerates an unedited Draft with the same key.
5. Never publishes automatically.

Tank-mate conclusions require the configured compatibility confidence
threshold. Tank-size output describes constraints and directs readers to the
Aquarium Builder; it does not claim a generated stocking plan is guaranteed
safe.

## Admin workflow

Administrators use `/admin/guides` to:

- Search and filter Guides.
- Generate one of the supported Guide families.
- Open the shared Article editor and protected preview.
- Edit sections, SEO fields, images, categories, tags, and sources.
- Review validation feedback.
- Publish manually.
- Archive Published Guides.
- Review and explicitly apply regeneration proposals.

Publishing a Guide invokes the Guide validation service, not the ordinary
Article validator.

## Validation and search-intent protection

`src/lib/guides/validation/` extends the content validation conventions with:

- Required Guide metadata and supported family checks
- Generation-key and primary-intent uniqueness
- Required and meaningful sections
- Family-specific recommendation minimums
- Compatibility confidence requirements
- Slug and canonical URL uniqueness
- Internal-link and related-content availability
- Exact conflict errors and explainable likely-overlap warnings

Exact generation, search-intent, source-identity, slug, and route conflicts
block publication. Controlled title or topic overlap is a warning for editorial
review.

## Regeneration and manual-edit protection

Generated content and source inputs receive stable SHA-256 hashes. The persisted
content hash is compared with the last generated baseline to detect manual
edits.

Safety rules:

- An unedited Draft may regenerate in place.
- A manually edited Draft receives a stored proposal for review.
- A Published Guide is never edited in place.
- Applying a Published proposal requires explicit confirmation and atomically
  moves the Guide back to Draft before changing content.
- Applying a proposal never republishes the Guide.
- Archived Guides cannot be regenerated or restored automatically.
- A proposal hash prevents a stale proposal from being applied.

Source freshness checks are explicit administrative/service operations. Public
page requests do not scan the database for source changes. Background
regeneration is intentionally out of scope.

## Public rendering and internal links

The public Guide route reuses Article block rendering, signed content images,
SEO metadata, breadcrumbs, sources, Article schema, and FAQ schema.

The existing internal-linking engine recognizes `guide` targets and resolves
them to `/learning-center/guides/[slug]`. It can surface relevant species, Care
Guides, compatibility reports, Articles or Guides, Aquarium Builder links, and
supported product resources.

For Published Guides, a narrow database function returns only the generated
`internalLinks` suggestions. The public renderer sends them through the shared
path validation, deduplication, self-link, and limit filters. All other
generation metadata and source fingerprints remain admin-only.

The Learning Center keeps Articles and Guides as separate discovery streams.
Guide cards use the first assigned Guide image by display order.

## Adding a future family

To add a family:

1. Add the family identifier to the Guide domain type.
2. Define a normalized generation-key builder.
3. Add a structured-data loader.
4. Implement the shared `GuideGenerator` interface.
5. Add family-specific validation rules.
6. Register its admin inputs and labels.
7. Add deterministic generator, identity, validation, and safety tests.

Do not add another publishing entity, editor, validation framework, or
internal-linking system.

## Testing

Focused checks:

```powershell
npm.cmd test -- src/lib/guides
.\node_modules\.bin\tsc.cmd --noEmit --project tsconfig.build.json
.\node_modules\.bin\eslint.cmd src/lib/guides src/app/admin/guides src/app/learning-center/guides
```

The project owner runs the production build:

```powershell
npm run build
```

## Known limitations and out of scope

- No automatic publishing or background regeneration
- No AI-generated prose
- No semantic keyword-cannibalization analysis
- No automatic source-change jobs
- No automatic merge, archive, or deletion behavior
- No Quantity, Beginner, Compatibility Hub, Aquascaping, or Species Collection
  generators yet
- Editorial review remains required before every publication

# GuideMyTank Plant Catalog

## Purpose

The plant catalog is a reusable database-backed foundation for freshwater
aquarium plants. Its only current consumer is the Aquarium Builder. Public
plant listings, profiles, care guides, SEO routes, and plant compatibility are
out of scope.

## Database

`public.plants` stores stable UUIDs, slugs, common and scientific names,
optional descriptions and husbandry ranges, controlled care attributes, an
active flag, and timestamps.

Controlled values are:

- care level: `beginner`, `intermediate`, `advanced`
- growth rate: `slow`, `moderate`, `fast`
- placement: `foreground`, `midground`, `background`, `floating`, `epiphyte`
- light level: `low`, `medium`, `high`

Nullable fields are intentionally left null when the catalog does not have a
defensible generalized value. `co2_required` means an absolute requirement;
plants that merely benefit from supplemental carbon dioxide remain false.

Row Level Security permits public reads only when `is_active = true`. No public
insert, update, or delete policies exist.

The schema is installed in three ordered migrations:

- `20260716010000_create_plants.sql` creates the table, constraints, index, and
  updated timestamp trigger.
- `20260716011000_seed_plants.sql` upserts the initial catalog by slug.
- `20260716012000_enable_plants_rls.sql` enables and forces RLS.

Apply them through the normal Supabase migration workflow (`npx supabase db
push` for a linked project). The seed migration is idempotent and travels with
the schema migrations; there is no separate manual seed command.

## Seed Data

The initial catalog contains Java Fern, Anubias Nana, Amazon Sword,
Vallisneria, and Dwarf Hairgrass. Seed rows are upserted by slug. Descriptions
document generalized placement or taxonomy details that cannot be represented
by a single controlled column.

## Domain Model and Mapping

`src/lib/plants/types.ts` defines the camelCase `Plant` domain model and its
controlled-value unions. `PlantDatabaseRow` is derived from the generated
Supabase `Database` type instead of duplicating the table row shape.

`mapPlantDatabaseRow()` converts database snake_case fields to the domain
model. It validates controlled values at the database boundary so malformed
records do not silently enter builder state.

## Service API

`src/lib/plants/service.ts` provides server-side queries using the shared
static Supabase client:

- `getPlants()` returns all active plants in deterministic name order.
- `searchPlants(query)` searches active plants by common or scientific name.
- `getPlantById(id)` resolves one active stable plant ID.
- `getPlantsByIds(ids)` resolves a deduplicated group of selected IDs.

Search input is stripped of PostgREST filter syntax characters before it is
used in the `ilike` expression. UI components must consume this service through
a Server Component or other server-side boundary rather than querying Supabase
directly.

## Aquarium Builder Integration

The existing `/aquarium-builder/plants` route loads active catalog records
through `getPlants()` in its Server Component and passes domain records to the
client selector. The selector searches common and scientific names locally
within that database-backed result, avoiding a network request on every
keystroke.

Builder selections contain only a stable `plantId`, positive integer quantity,
and optional notes. Adding the same plant again updates its existing quantity
rather than creating a duplicate row. The shared local-storage document
preserves selections when moving between the selector and main builder.

## Planted-Level Calculation

`calculatePlantedLevel()` in `src/lib/aquarium-builder/plants.ts` is the single
React-independent source for planted density. It sums positive whole-number
plant quantities and ignores invalid, zero, negative, fractional, and
non-finite quantities.

The existing MVP density rules are preserved:

- no valid plants: `none`
- below 0.25 plants per gallon: `light`
- 0.25 through below 0.5 plants per gallon: `moderate`
- 0.5 plants per gallon or above: `heavy`

When plants exist but exact positive tank volume is unavailable, the result is
conservatively `light`. An explicitly stored non-`none` level continues to take
precedence. The stocking adapter delegates to this helper and does not maintain
another set of thresholds.

## Current Limitations

- Placement stores one primary value rather than multiple possible uses.
- Husbandry values are generalized at the species/catalog level.
- There are no plant images in the initial seed.
- Plant compatibility, lighting validation, CO2 recommendations, fertilizer,
  substrate, affiliate products, and public plant pages are not implemented.

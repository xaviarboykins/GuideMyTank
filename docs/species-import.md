# Species Import Process

GuideMyTank imports species data from JSON files into Supabase with:

- required field validation
- duplicate slug checks within the import file
- duplicate slug protection against existing Supabase rows
- optional updates for existing species
- strict enum validation for standardized species fields
- repeatable alias replacement

## Master Dataset

The canonical source of truth is:

```txt
data/import/species.master.json
```

Use JSON because species records include arrays, optional source-tracking fields,
and long-term compatibility metadata that do not fit cleanly in CSV.

Example file:

```txt
data/import/species.example.json
```

The import file may be either:

```json
{
  "species": []
}
```

or a top-level array:

```json
[]
```

## Required Fields

Each species object must include:

- `slug`
- `common_name`
- `scientific_name`

## Species Fields

Supported top-level species fields:

- `common_name`
- `scientific_name`
- `slug`
- `family`
- `origin`
- `region`
- `min_ph`
- `max_ph`
- `min_temp_f`
- `max_temp_f`
- `tank_size_gal`
- `bioload_rating`
- `min_group_size`
- `temperament`
- `aggression_level`
- `schooling`
- `diet`
- `care_level`
- `lifespan_years`
- `breeding_difficulty`
- `plant_safe`
- `invert_safe`
- `compatibility_tags`
- `max_size_inches`
- `image_url`
- `summary`

Optional related field:

- `aliases`: array of alternate names

## Allowed Values

`temperament`:

- `Peaceful`
- `Semi-Aggressive`
- `Aggressive`

`diet`:

- `Carnivore`
- `Herbivore`
- `Omnivore`

`care_level`:

- `Easy`
- `Intermediate`
- `Advanced`

`compatibility_tags`:

- `community`
- `nano_tank`
- `large_tank`
- `peaceful`
- `semi_aggressive`
- `aggressive`
- `schooling`
- `solitary`
- `territorial`
- `bottom_dweller`
- `mid_water`
- `top_water`
- `plant_safe`
- `invert_safe`
- `shrimp_safe`
- `beginner_friendly`
- `blackwater`
- `hardwater`
- `softwater`
- `sand_preferred`
- `rockwork_preferred`

## Validation Rules

The script validates the file before writing to Supabase.

It rejects:

- missing required fields
- duplicate slugs inside the same file
- duplicate common names inside the same file
- slugs outside lowercase letters, numbers, and hyphens
- unknown fields
- wrong field types
- unsupported enum values
- `bioload_rating` or `aggression_level` outside `1` through `10`
- `tank_size_gal` values that are not positive numbers
- pH ranges where `min_ph` is greater than `max_ph`
- pH values outside `0` through `14`
- temperature ranges where `min_temp_f` is greater than `max_temp_f`
- unknown compatibility tags
- `image_url` values that do not match `/species/{slug}.webp`
- invalid alias arrays

Slug format:

```txt
lowercase-words-with-hyphens
```

Image path format:

```txt
/species/{slug}.webp
```

Do not hotlink third-party images. Store production species images in:

```txt
public/species/
```

## Environment Variables

Set these before running a real import:

```bash
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

The script also accepts `NEXT_PUBLIC_SUPABASE_URL`, but real imports should use
`SUPABASE_SERVICE_ROLE_KEY`.

Do not commit service role keys.

## Dry Run

Always run a dry run first:

```bash
python scripts/import_species.py data/import/species.master.json --dry-run
```

Dry run validates the local file and prints a summary. It does not contact
Supabase and does not write data.

For the master dataset, use strict validation:

```bash
npm run validate:species
```

Strict mode requires every species to include complete v2 product fields:

- identity
- classification
- water parameters
- tank requirements
- behavior
- husbandry
- compatibility flags and tags
- physical size
- local image path
- summary

## Import New Species

After dry run passes, run:

```bash
npm run import:species
```

By default, the script blocks the import if any file slug already exists in
Supabase. This prevents accidental duplicate or unintended updates.

## Update Existing Species

To update existing species matched by slug:

```bash
npm run import:species:update
```

With `--update-existing`:

- existing `species` rows are patched by `slug`
- new species are inserted
- aliases are replaced when `aliases` is present

If `aliases` is omitted, the script leaves existing aliases unchanged.

## Repeatable Import Workflow

1. Edit `data/import/species.master.json`.
2. Run dry run.
3. Fix validation errors.
4. Run real import.
5. Spot-check Supabase rows.
6. Run the app locally and verify `/piscidex` and `/species/[slug]`.

Recommended local checks:

```bash
npm run lint
npm run build
```

## Data Cleanliness Notes

- Treat `slug` as the stable import key.
- Keep slugs lowercase and permanent once public pages exist.
- Prefer updating existing rows with `--update-existing` instead of changing slugs.
- Include aliases only when the full alias list for that species is ready, because aliases are replaced as a set.
- Use `Easy`, not `Beginner`, for beginner-friendly species.
- Use `summary` for the page description field.
- Use `tank_size_gal` for the minimum recommended tank size.

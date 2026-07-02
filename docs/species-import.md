# Species Import Process

GuideMyTank imports species data from JSON files into Supabase with:

- required field validation
- duplicate slug checks within the import file
- duplicate slug protection against existing Supabase rows
- optional updates for existing species
- repeatable related-data handling for aliases, water parameters, and stocking profiles

## Import Format

Use JSON for species imports because species records can include nested related data.

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

Each species object must include:

- `slug`
- `common_name`
- `category`

Optional top-level species fields:

- `scientific_name`
- `family`
- `origin_region`
- `temperament`
- `care_level`
- `diet`
- `short_description`
- `min_tank_gallons`
- `max_size_inches`
- `min_temp_f`
- `max_temp_f`
- `min_ph`
- `max_ph`
- `schooling`
- `minimum_group_size`
- `reef_safe`

Optional related fields:

- `aliases`: array of alternate names
- `water_parameters`: one object for the `water_parameters` table
- `stocking_profile`: one object for the `stocking_profiles` table

## Validation Rules

The script validates the file before writing to Supabase.

It rejects:

- missing required fields
- duplicate slugs inside the same file
- slugs outside lowercase letters, numbers, and hyphens
- unknown fields
- wrong field types
- invalid alias arrays
- invalid nested `water_parameters` or `stocking_profile` objects

Slug format:

```txt
lowercase-words-with-hyphens
```

## Environment Variables

Set these before running a real import:

```bash
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

The script also accepts `NEXT_PUBLIC_SUPABASE_URL`, but real imports should use `SUPABASE_SERVICE_ROLE_KEY`.

Do not commit service role keys.

## Dry Run

Always run a dry run first:

```bash
python scripts/import_species.py data/import/species.example.json --dry-run
```

Dry run validates the local file and prints a summary. It does not contact Supabase and does not write data.

## Import New Species

After dry run passes, run:

```bash
python scripts/import_species.py data/import/species.example.json
```

By default, the script blocks the import if any file slug already exists in Supabase. This prevents accidental duplicate or unintended updates.

## Update Existing Species

To update existing species matched by slug:

```bash
python scripts/import_species.py data/import/species.example.json --update-existing
```

With `--update-existing`:

- existing `species` rows are patched by `slug`
- new species are inserted
- aliases are replaced when `aliases` is present
- `water_parameters` is upserted when present
- `stocking_profiles` is upserted when present

If a related field is omitted, the script leaves that related data unchanged.

## Repeatable Import Workflow

1. Edit or create a JSON import file.
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
- Keep source files in `data/import/` so imports are reviewable and repeatable.

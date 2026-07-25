# Phase 11I Species Factual Review — Consolidated Report

Date: July 2026

## Outcome

All 100 local Species records were included in the Phase 11I risk-based review. Twenty-seven records currently differ from the repository baseline in one or more factual, compatibility, taxonomy, provenance, or text-cleanup fields.

No Supabase import or synchronization was performed.

## Risk-based batches

1. Predators, puffers, and specialist species
2. Cichlids
3. Territorial community fish
4. Bottom dwellers
5. Schooling community fish
6. Livebearers and invertebrates
7. Cool-water and flow specialists
8. Remaining unusual specialists and final cross-check

Detailed decisions and deferred questions are recorded in the corresponding `species-factual-review-batch-*.md` files in this directory.

## Major factual corrections

### Taxonomy and identity

- Green Severum: `Heros severus` → `Heros efasciatus`
- Red Eye Tetra: `Moenkhausia sanctaefilomenae` → `Bario sanctaefilomenae`
- Buenos Aires Tetra: `Hyphessobrycon anisitsi` → `Psalidodon anisitsi`
- Peppered Cory: `Corydoras paleatus` → `Hoplisoma paleatum`
- Panda Cory: `Corydoras panda` → `Hoplisoma panda`
- Mystery Snail: `Pomacea bridgesii` → `Pomacea diffusa`
- Crystal Red Shrimp: `Caridina cantonensis` → `Caridina logemanni`
- Several American tetra family assignments updated to `Acestrorhamphidae`

Historical scientific names were retained as aliases where appropriate.

### Predation and feeding competition

- Removed the erroneous mouth-gape predator flag from Cherry Shrimp.
- Added mouth-gape predation risk to Green Severum and Jack Dempsey.
- Removed the erroneous competitive-feeder flag from Keyhole Cichlid.
- Marked Common Goldfish as a competitive feeder relative to slow fancy goldfish.
- Corrected Bubble Eye Goldfish from active/competitive to calm/noncompetitive.

### Habitat and water preferences

- Siamese Algae Eater changed to high-flow preference.
- Moonlight Gourami changed to low-flow preference.
- Weather Loach changed to low-flow, planted/slow-water setup.
- American Flagfish changed to low-flow preference.
- Recommended temperature ranges were narrowed, while retaining broader tolerated bounds, for Golden Wonder Killifish, Red Eye Tetra, and Moonlight Gourami.

### Social and territorial requirements

- Wrestling Halfbeak minimum group increased from 3 to 4.
- Upside-Down Catfish minimum group increased from 3 to 5.
- Peter's Elephantnose Fish received a medium bottom-territory footprint.

## Compatibility-engine implications

The corrections strengthen generic engine inputs instead of forcing outcomes:

- Predation follows size, body shape, feeding ecology, and mouth-gape risk.
- Fin conflicts follow fin-nipping and long-fin vulnerability.
- Territory conflicts follow zone and footprint.
- Habitat conflicts follow flow, temperature, hardness, tank style, and specialist requirements.
- Social warnings follow group requirements and breeding behavior.

No named fish-pair override was added.

## Remaining medium-priority items

The automated care-data audit reports:

- High priority: 0
- Medium priority: 26
- Low priority: 0

Most remaining medium items are source-depth warnings where a record still relies heavily on Wikipedia or has only one strong source. These are provenance tasks, not detected factual contradictions.

Two range questions remain deliberately deferred:

- Chili Rasbora has a broad pH range that may obscure its preferred acidic conditions.
- Weather Loach has a broad temperature tolerance that should remain distinct from an ideal captive range.

## Known schema limitations

1. `min_group_size` cannot express “keep singly or in a sufficiently large group,” as seen with Elephantnose Fish.
2. It cannot express sex-ratio requirements for livebearers, halfbeaks, or some cichlids.
3. `species_only_preferred` cannot express safe specialist cohorts such as similarly slow fancy goldfish.
4. Shrimp colony recommendations are not biological schooling.
5. Wild maximum size and typical captive adult size are separate concepts.
6. A generic species record cannot perfectly represent every captive strain sold under broad names such as Discus or Bristlenose Pleco.

These limitations do not justify named-pair hardcoding. New generic fields should be added only if future product behavior proves they are necessary.

## Validation

- Strict local Species validation: 100 records passed
- Species source validation: passed
- Compatibility regression matrix: passed
- Unit/integration tests: 50 files, 305 tests passed
- TypeScript (`tsc --noEmit`): passed
- ESLint: passed
- Git diff whitespace check: passed
- Production build: not run, per project-owner instruction

## Database drift

The read-only database audit reports:

- Local Species: 100
- Database Species: 100
- Species with mismatches: 100
- Field mismatches: 1,847
- Structural issues: 0
- Species missing source entries: 0

The database must not be treated as the factual master. The reviewed local dataset is the synchronization candidate, but a database update should be a separate, explicitly approved operation with a dry-run summary and post-import compatibility validation.

## Recommendation

Phase 11I factual review is complete enough to proceed to a controlled synchronization phase. Before writing:

1. Review the generated database diff report.
2. Confirm taxonomy changes will not break references that use Species IDs or slugs.
3. Run the update-existing Species importer in a dry-run or preview mode if supported.
4. Back up or export the current Species rows.
5. Synchronize the local master and source provenance.
6. Rerun database audit, compatibility matrix, tests, and selected live report checks.

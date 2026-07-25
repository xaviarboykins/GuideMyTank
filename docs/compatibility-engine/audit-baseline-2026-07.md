# Compatibility audit baseline — July 2026

Phase 11A calculated all 4,950 canonical pairs using the live database and the
unchanged pre-correction engine.

## Baseline

- Database Species: 100
- Local master Species: 100
- Computed compatible: 3,273
- Computed caution: 1,024
- Computed incompatible: 653
- Flagged review pairs: 233
- Compatible pairs containing two nonpeaceful Species: 195
- Compatible pairs with high combined aggression: 48
- Compatible pairs containing two territorial Species: 27
- Generic engine and database override disagreements: 4

The computed compatible share is 66.1%. Audit flags are review heuristics, not
automatic corrections.

## Betta and Moonlight Gourami trace

The unchanged engine returns 85, Compatible:

- Temperature: 20
- pH: 15
- Aggression: 15
- Social/grouping: 10
- Predation: 20
- Tank size: 5
- Trait cap: none
- Behavior cap: none

The database describes Betta as semi-aggressive with aggression level 6, but
Moonlight Gourami as peaceful with aggression level 2. Moonlight Gourami lacks
the structured interspecific territorial evidence needed to trigger a generic
behavior constraint. Broad water overlap and the positive “no predation” score
therefore dominate the aggregate result.

This is both a model problem and a data problem:

1. The aggregate score permits positive environmental factors to cancel
   behavioral risk.
2. Absence of a detected risk awards positive points.
3. Missing structured behavior does not reduce decision confidence.
4. Production data does not populate multiple fields already supported by the
   schema and local master dataset.

The pair must not be corrected with a named score adjustment. Phase 11C should
use structured findings, hard constraints, conditional statuses, and improved
behavior data.

## Data consistency

Local and database Species slug inventories both contain 100 records, so the
Compatibility dropdown has no current source-data omission. It does not filter
Species client-side. Previously missing choices are most likely explained by a
stale one-day rendered page or an earlier database/import state.

The live database contains 10 explicit rules while the tracked override file
contains 7. Most entries do not match, and Angelfish/Neon Tetra has a
classification mismatch. Override sources must be reconciled before engine
corrections.

Computed confidence is currently `score / 100`. It measures compatibility
strength rather than confidence in the decision and must be separated during
the correction phases.

## Correction boundary

Phase 11A changes diagnostics and reporting only. It does not change public
scores or database records.

The smallest safe correction path is:

1. Reconcile and populate approved structured data.
2. Introduce structured findings while preserving current output.
3. Resolve hard blockers before soft factors.
4. Separate general pair analysis from Builder context.
5. Centralize override-aware results across every application surface.
6. Introduce conditional and insufficient-data outcomes with an explicit
   migration and UI compatibility plan.

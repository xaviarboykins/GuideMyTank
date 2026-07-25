# Phase 11 Final Validation — July 2026

## Scope

Phase 11 audited and corrected the deterministic freshwater compatibility
engine, reviewed the 100-Species factual dataset, synchronized the reviewed
data and provenance with Supabase, and re-audited every canonical pair.

## Final compatibility audit

- Database Species: 100
- Canonical unordered pairs: 4,950
- Flagged pairs: 0
- Known regression failures: 0
- Compatible: 1,421
- Caution: 2,430
- Incompatible: 1,099

The final generic correction prevents two semi-aggressive or aggressive
Species from receiving an unconditional compatible result. These combinations
are capped at caution because successful coexistence depends on aquarium size,
territory, cover, stocking, and individual behavior.

No production decision uses a Species slug, named pair, or expert override.

## Final Species audit

- Local Species: 100
- Database Species: 100
- Field mismatches: 0
- Alias mismatches: 0
- Source-reference mismatches: 0
- Structural issues: 0
- High-priority factual flags: 0
- Medium-priority factual flags: 0
- Low-priority factual flags: 0
- Database source references: 245

## Regression fixtures

The known-pair matrix covers known-good, caution, incompatible, and
context-dependent cases. These fixtures detect regressions but never alter
production results. The expert-validated override file remains intentionally
empty.

## Adding Species safely

1. Add complete structured data to `data/import/species.master.json`.
2. Add factual provenance to `data/import/species.sources.json`.
3. Run Species, source, and care-data validation.
4. Run the compatibility matrix and exhaustive compatibility audit.
5. Review any flagged pair as evidence of a missing generic trait or rule.
6. Never fix a result with a Species slug, named pair, or summary-text match.
7. Synchronize only after factual review and validation are approved.
8. Re-run database parity and compatibility audits after synchronization.

## Known limitations

- Results describe general pair suitability, not a guarantee for an individual
  aquarium.
- The Builder evaluates tank volume, quantities, group sizes, stocking, and
  equipment separately.
- Oxygen demand has no dedicated structured field.
- Shrimp and snail predation currently share broader invertebrate-safety data.
- Breeding behavior and individual temperament can make a caution pairing fail.
- Expert review tooling is retained for future evidence collection but has no
  runtime authority.

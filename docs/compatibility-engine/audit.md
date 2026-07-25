# Compatibility audit

Run the exhaustive current-engine audit with:

```bash
npm run audit:compatibility
```

The command reads current Species and explicit Compatibility rules from
Supabase, calculates every canonical pair in both directions, and writes the
ignored report `reports/compatibility/audit.json`.

The audit does not change scores, statuses, rules, or database records. It
records raw evaluator points, score caps, computed and effective results,
symmetry, structured evidence, data coverage, local/database parity, override
parity, known regressions, and ranked review flags.

Flags are review heuristics, not automatic husbandry verdicts. They identify
where unconditional compatibility deserves investigation. Engine corrections
must use general structured evaluators and hard constraints rather than adding
pair-specific score manipulation.

## Structured findings

Phase 11B adds typed findings to the diagnostic result without changing the
public compatibility result. Each current evaluator now exposes categorized
information, warning, or error findings with point and cap evidence. Missing
essential pair data is reported explicitly as data-quality findings.

The existing numeric resolver remains authoritative until Phase 11C. Findings
must not be interpreted as changing a public status during Phase 11B.

## Hard constraints

Phase 11C resolves error-level findings before the aggregate score. Supported
generic blockers are limited to current structured evidence: temperature and pH
non-overlap, predation, species-only requirements, and severe mutual aggression.
Missing essential data prevents an unconditional compatible result and maps to
the existing caution classification until richer statuses are introduced.

No hard constraint checks Species slugs or contains a production pair list.
Environment, salinity, strict hardness, oxygen, and Builder-specific space
constraints remain deferred because the required structured context does not
yet exist.

The exhaustive report preserves the legacy result beside the corrected result.
Its `corrections` collection contains only pairs whose score or classification
changed, so the effect of every generic constraint remains reviewable.

The legacy species-special-rule layer and slug fallback lists were removed
during Phase 11C. Taxonomic checks, such as identifying freshwater puffers by
family, remain valid structured inputs and do not identify a named Species or
pair.

## Phase 11J final re-audit

The final July 2026 audit evaluated all 4,950 canonical pairs from 100
synchronized freshwater Species.

- Flagged pairs: 0
- Symmetry failures: 0
- Known regression failures: 0
- Compatible: 1,421
- Caution: 2,430
- Incompatible: 1,099

The re-audit initially found 34 unconditional compatible results where both
Species were semi-aggressive or aggressive. A generic structured behavior cap
now classifies these as caution. The correction does not inspect Species slugs
or named pairs.

The generated report remains local and ignored:

```text
reports/compatibility/audit.json
```

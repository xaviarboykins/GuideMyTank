# Species Database Accuracy Audit — July 2026

## Scope

This is the read-only Phase 11I comparison of the Supabase `species` table,
the canonical local master, structural care-data rules, and recorded source
coverage.

Run:

```bash
npm run audit:species-database
```

The machine-readable report is written to the ignored path
`reports/species/database-audit.json`.

## Database parity

- Local Species: 100
- Database Species: 100
- Local-only Species: 0
- Database-only Species: 0
- Species with at least one mismatch: 100
- Field mismatches: 1,832
- Structurally impossible ranges: 0

Sixteen compatibility-critical fields differ for all 100 Species:

- flow preference
- activity level
- hardness preference
- temperature category
- preferred tank style
- territory zone and footprint
- minimum and maximum GH
- minimum and maximum KH
- temperature source notes
- recommended minimum and maximum temperature
- tolerated minimum and maximum temperature

The database also lacks many reviewed boolean traits and care warnings. It must
not be synchronized until the local master receives factual review.

## Existing core-field drift

The only non-confidence drift in the older core compatibility fields is the Pea
Puffer social profile:

- local: schooling, minimum group six
- database: solitary, minimum group one

This needs explicit husbandry-source review because it materially changes both
the compatibility engine and Builder group-size guidance.

## Source coverage

- Species source entries: 100
- Recorded URLs after remediation: 169
- Newly added FishBase references: Angelfish, Betta, Corydoras, Guppy, Honey
  Gourami, and Neon Tetra
- Source validation now rejects empty source arrays

The source library remains too dependent on Wikipedia and one general pet-care
publisher. URL presence does not prove that every structured field was checked.
Compatibility-critical factual review should proceed in risk-based batches and
record stronger references before import.

## Heuristic care review

The local care audit initially flagged five broad ranges. Four temperature flags
were caused by auditing legacy tolerated ranges instead of the narrower
recommended ranges used by compatibility scoring. The audit now evaluates the
recommended temperature range when available.

Chili Rasbora's broad pH range remains a factual review item.

## Local master audit

The expanded local audit checks behavior and provenance in addition to water
parameters. It found:

- high-priority internal contradictions: 0
- schooling/minimum-group contradictions: 0
- schooling/tag contradictions: 0
- species-only/community contradictions: 0
- territory-tag/footprint contradictions: 0
- hardness/GH contradictions: 0
- stream-style/flow contradictions: 0
- recommended temperature outside tolerated range: 0
- factual range review items: 2
- provenance and confidence review items: 63

The remaining range reviews are Chili Rasbora pH and Weather Loach recommended
temperature.

Fifty-seven Species currently rely entirely on Wikipedia URLs. Six Species
marked `high` confidence have fewer than two sources. Oscar, Discus, Pea
Puffer, and Common Goldfish also need stronger independent sourcing before
their confidence labels can be accepted.

The master is internally consistent, but internal consistency is not factual
verification. It remains blocked from import pending risk-based husbandry
source review.

## Import gate

Do not run `npm run import:species:update` until:

1. high-risk behavior and predation traits are source reviewed;
2. the Pea Puffer social profile is resolved;
3. remaining heuristic flags are reviewed;
4. local validation, source validation, the Species audit, and the
   compatibility matrix pass;
5. the expected compatibility distribution change is reviewed.

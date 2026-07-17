# Aquarium Validation Engine

## Purpose and Scope

The Aquarium Validation Engine evaluates an `AquariumBuild` for biological
compatibility, husbandry requirements, and stocking risk. It is UI-independent
and reusable, but the Aquarium Builder is its only MVP consumer. Saved builds,
public builds, wizards, AI features, affiliate recommendations, and mobile
integrations are intentionally out of scope.

The primary API is `validateAquarium(input, options)` from
`src/lib/aquarium-validation`. It returns an `AquariumValidationReport` with a
deterministically sorted issue list, severity counts, an evaluation timestamp,
and `valid`. A report is invalid only when it contains at least one error;
warnings and information findings do not invalidate a build.

## Input and Output

The engine uses the existing Aquarium Builder `AquariumBuild` type rather than
maintaining a second build model. Callers resolve selected species into
`AquariumResolvedLivestockEntry` records and provide them through validator
context. The engine can also accept an existing `StockingAnalysisResult` so a
consumer does not repeat stocking calculations.

Each issue contains a stable rule code, category, severity, user-facing title
and message, optional recommendation, affected species IDs, and optional
metadata. Severity values are `error`, `warning`, and `info`.

## Validator Architecture

Validators implement the shared `AquariumValidator` contract and receive one
context containing the normalized build, resolved species, unique species
pairs, cached compatibility results, and stocking analysis. The deterministic
registry runs:

1. tank size
2. school size
3. water parameters
4. heating
5. compatibility
6. predation
7. territorial behavior
8. stocking

The orchestrator generates each unordered species pair once and resolves its
Compatibility Service result once. It catches individual compatibility and
validator failures so supported checks can still return a partial report.

To add a validator, implement `AquariumValidator`, create issues with the shared
issue helper and code constants, add focused tests, and register it in
`src/lib/aquarium-validation/validators/index.ts`. A validator should use
structured repository data or an existing service and must not establish a
competing source of biological truth.

## Rule Categories and Codes

- Compatibility: `COMPATIBILITY_CAUTION`, `COMPATIBILITY_INCOMPATIBLE`,
  `COMPATIBILITY_UNKNOWN`
- Predation: `PREDATION_HIGH_RISK`, `PREDATION_POSSIBLE`
- Territorial: `TERRITORIAL_SAME_SPECIES_CONFLICT`,
  `TERRITORIAL_PAIR_CONFLICT`, `TERRITORIAL_SPACE_WARNING`
- School size: `SCHOOL_SIZE_BELOW_MINIMUM`
- Water: `WATER_TEMPERATURE_NO_OVERLAP`,
  `WATER_TEMPERATURE_NARROW_OVERLAP`, `WATER_PH_NO_OVERLAP`,
  `WATER_PH_NARROW_OVERLAP`, `WATER_GH_NO_OVERLAP`,
  `WATER_KH_NO_OVERLAP`, `WATER_PARAMETER_DATA_INCOMPLETE`
- Tank: `TANK_NOT_SELECTED`, `TANK_BELOW_SPECIES_MINIMUM`, `TANK_AT_MINIMUM`
- Stocking: `STOCKING_LIGHT`, `STOCKING_NEAR_CAPACITY`, `STOCKING_FULL`,
  `STOCKING_OVER_CAPACITY`, `STOCKING_ANALYSIS_UNAVAILABLE`
- Heating: `HEATING_REQUIREMENT_UNAVAILABLE`,
  `HEATING_TEMPERATURE_CONFLICT`, `HEATER_REQUIRED_MISSING`,
  `HEATER_RECOMMENDED_MISSING`, `HEATER_UNDERSIZED`,
  `HEATER_OUTSIDE_SUPPORTED_RANGE`, `HEATER_SPECIFICATION_MISSING`,
  `HEATER_INACTIVE`, `HEATER_MAY_BE_UNNECESSARY`,
  `MULTIPLE_HEATERS_UNSUPPORTED`

Tank and school rules use existing species guideline fields. Water validation
intersects all complete species ranges and treats missing optional data as
unknown rather than incompatible. Compatibility, predation, and cross-species
territorial rules reuse Compatibility Service output. Stocking rules map the
existing Stocking Analysis Engine statuses without repeating capacity or
bioload calculations.

Heating prefers the selected species' recommended temperature ranges and falls
back to the canonical species temperature range when legacy database rows have
not populated the newer recommended fields. A shared
minimum of 72°F or warmer requires a heater; 68–71°F with a shared maximum
above 72°F recommends one; ranges ending at 72°F or below normally do not
require one; and broader ranges spanning those thresholds leave heating
optional. Missing recommended temperature data produces an incomplete-data
finding, while non-overlapping recommended ranges produce an error.

Exactly one heater is supported. The validator uses current catalog active
status and documented minimum/maximum tank volume. It does not infer heater
performance from watts, ambient temperature, or a watts-per-gallon formula.

## Deduplication and Sorting

Exact duplicates use a deterministic key derived from rule code, sorted
affected species IDs, and stable metadata. Pair order therefore does not change
keys or issue IDs. Findings sort by severity (error, warning, info), then
category, code, title, and affected species IDs.

## Missing Data and Failure Behavior

The engine normalizes absent build arrays and supports no tank, no livestock,
one species, incomplete husbandry ranges, missing compatibility results, and an
unavailable stocking result. Validators skip unsupported conclusions and use
information findings only where the reduced confidence is useful. One failing
validator does not prevent the remaining validators from producing a report.
Raw internal errors are not exposed in builder findings.

## Aquarium Builder Integration

The builder calls a dedicated server action after a short debounce. The action
resolves every selected species, then validates the complete group while
reusing the builder's stocking analysis. A request sequence prevents stale
responses from replacing newer results. The UI displays overall status,
severity counts, sorted findings, affected species names, and recommendations.

## Biological Limitations

Predation findings require explicit predation evidence from the existing
Compatibility Service. Size difference, diet, or temperament alone does not
create a predation finding. This is not a predator-prey simulation.

Cross-species territorial findings require explicit territorial or aggression
evidence from Compatibility Service output. Same-species warnings require
multiple individuals plus conservative structured territorial, solitary, and
aggression signals. Territory footprint, swimming zones, aquascape, sex ratio,
individual behavior, breeding state, and sight-line management cannot be fully
represented by the current data model.

Compatibility reasons are currently text rather than structured risk codes,
so predation and territorial recognition deliberately uses a narrow vocabulary.
Plant compatibility, lighting, CO2, fertilizer, and substrate validation are
not part of this engine.

## Verification

From the repository root:

```text
npm.cmd run lint
npm.cmd test
npm.cmd run build
```

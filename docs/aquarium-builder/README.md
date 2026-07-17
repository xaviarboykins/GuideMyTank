# GuideMyTank Aquarium Builder

## Purpose

The Aquarium Builder is the backend foundation for GuideMyTank's flagship planning tool: a PCPartPicker-style builder for freshwater aquariums.

The builder should help users assemble a practical tank plan from reusable parts:

- tank configuration
- livestock, including fish, shrimp, snails, and other aquarium animals
- equipment products
- estimated cost
- notes
- compatibility and stocking guidance

The builder is an orchestration layer. It should coordinate existing GuideMyTank services instead of reimplementing logic already owned elsewhere.

## Product Vision

The long-term product goal is "PCPartPicker for aquariums."

Users should eventually be able to choose a tank, add livestock, add equipment, review cost, spot compatibility problems, and save or share a build. The experience should remain ugly-but-useful: fast, searchable, practical, and focused on hobbyist decisions rather than visual polish.

## Current M5 Scope

Milestone 5 establishes the reusable domain model, service layer, and working
builder interface.

Version 1 supports:

- tank size
- filtration level
- planted level
- livestock entries with species slugs and quantities
- equipment products with name, category, quantity, estimated price, optional URL, and optional notes
- aggregate estimated equipment cost
- build-level notes
- validation warnings
- compatibility analysis through the existing Compatibility Service
- a pure stocking-analysis engine using existing species data
- live stocking status and capacity details in the builder
- a dashboard summary for compatibility, stocking, bioload, estimated filter
  flow, and planted level
- an actionable livestock table with validation status, edit, and remove controls
- grouped errors, warnings, and recommendations
- deterministic heater and recommended-temperature validation
- five-level Build Health derived from existing validation findings
- expanded equipment, livestock, plant, heating, and temperature summaries
- a live estimated equipment subtotal
- local browser persistence for the in-progress build

This milestone does not add server-side saved-build persistence, starter kits,
affiliate-link behavior, Care Difficulty, livestock or plant prices, or product
recommendations.

## Future Roadmap

The model is designed so future features can be added without redesigning the builder:

- live plants
- saved builds
- starter kits
- richer biological stocking models
- category-specific product recommendations (deferred to Milestone 10)
- build sharing
- build templates

Future functionality should be added as new fields, modules, or services around the builder domain rather than by changing compatibility or species internals unnecessarily.

## Architecture

Builder code lives in:

```text
src/lib/aquarium-builder/
  stocking-analysis/
    builder.ts
    constants.ts
    engine.ts
    helpers.ts
    index.ts
    types.ts
    builder.test.ts
    engine.test.ts
  types.ts
  storage.ts
  service.ts
```

The builder owns aquarium-build orchestration only.

It does not own:

- species database access rules
- water parameter merge behavior
- pairwise compatibility scoring
- manual compatibility rule handling
- compatibility engine calculations

Those responsibilities stay in the existing systems that already own them.

## Domain Model

The shared domain model is defined in `src/lib/aquarium-builder/types.ts`.

Primary types:

- `AquariumBuild`
- `AquariumTankConfiguration`
- `AquariumFiltrationLevel`
- `AquariumPlantedLevel`
- `AquariumLivestockEntry`
- `AquariumResolvedLivestockEntry`
- `AquariumEquipmentProduct`
- `AquariumEstimatedCost`
- `AquariumAnalysis`
- `AquariumBuilderWarning`
- `AquariumBuilderRecommendation`
- `AquariumBuilderResult`

The current model includes optional metadata fields such as `id`, `createdAt`, `updatedAt`, and `expiresAt` so future saved-build persistence can use the same domain object. These fields are not persistence behavior by themselves.

## Service Responsibilities

The reusable service layer is defined in `src/lib/aquarium-builder/service.ts`.

Current responsibilities:

- validate build input
- aggregate estimated equipment cost
- resolve livestock species from existing species data
- coordinate pairwise livestock compatibility through the Compatibility Service
- normalize builder state into stocking-analysis input
- call the pure stocking engine and return its structured result
- provide separate minimum-tank and minimum-group guidance
- return a unified `AquariumBuilderResult`

The unified result also includes the existing `AquariumValidationReport` at
`analysis.validation`. Callers may supply an already calculated stocking result
and injectable species, compatibility, and clock dependencies. The service
resolves livestock once, resolves each unique compatibility pair once, and
passes those shared results into Aquarium Validation rather than repeating
database reads or domain calculations.

When a heater is selected, the orchestration service also resolves that single
catalog product once by ID and supplies its current tank range and active status
to Aquarium Validation. The persisted Builder snapshot remains lightweight and
does not become a second source of product specifications.

## Build Health

The unified analysis derives a five-level Build Health result after Aquarium
Validation completes:

- `Invalid`: at least one validation error
- `High Risk`: three or more warnings
- `Needs Attention`: two ordinary warnings, incomplete supporting data, or an
  incomplete core analysis
- `Healthy`: complete core analysis with at most one warning; informational
  guidance may remain and the advisory is still exposed to the user
- `Excellent`: a tank, livestock, and filter are selected and the report has no
  errors, warnings, or informational findings

Heating affects health only through existing validation findings. Build Health
does not recalculate heater suitability, compatibility, stocking, or any other
domain result. Reason codes and messages are deterministic and are defined in
`src/lib/aquarium-analysis/build-health.ts`.

The service should remain usable from future server components, route handlers, server actions, scripts, or tests.

## Reused GuideMyTank Systems

The Aquarium Builder reuses:

- Species data layer: `src/lib/data/species.ts`
- Compatibility Service: `src/lib/compatibility/service.ts`
- Compatibility Types: `src/lib/compatibility/types.ts`
- Compatibility Engine indirectly through the Compatibility Service
- Water parameter data through the existing compatibility flow
- Existing species fields such as `tank_size_gal`, `min_group_size`, and `bioload_rating`

The builder should not directly call `calculateCompatibility()` from the engine. Calling the service preserves existing manual-rule handling and water-parameter overlay behavior.

## UI Derivation

The builder UI stays component-driven like PCPartPicker. Tank size is derived
only from a selected product with an exact gallon capacity. A product range is
not treated as an exact volume.

Filtration level is derived from hourly turnover when both exact tank gallons
and filter flow are available:

```text
turnoverPerHour = filterFlowRateGph / tankGallons

below 5x: Low
5x through below 8x: Standard
8x or above: High
```

Missing or unusable filter/tank data is treated conservatively as low
filtration.

An explicitly stored planted level takes precedence. Otherwise, selected plant
quantity derives an estimated density:

```text
no plants: None
below 0.25 plants per gallon: Light
0.25 through below 0.5 plants per gallon: Moderate
0.5 plants per gallon or above: Heavy
```

When plants exist but exact gallons are unavailable, the derived level is only
light. Plant quantity is a rough proxy until the project has species-level
plant size and coverage data.

## Stocking Analysis Engine

The pure engine lives under `src/lib/aquarium-builder/stocking-analysis`. It
does not query Supabase, read browser state, render UI, perform compatibility
checks, or validate husbandry.

The public entry point is:

```ts
analyzeStocking(input: StockingAnalysisInput): StockingAnalysisResult
```

`StockingAnalysisInput` contains exact tank gallons, normalized filtration and
planted levels, and livestock entries with species identity, quantity, and a
nullable bioload score. `StockingAnalysisResult` contains capacities, bioload,
utilization, status, completeness, estimated remaining livestock, applied
multipliers, and structured warnings.

### Data Source

Dedicated `stocking_profiles` data is not currently available in the generated
database types; a migration dropped the legacy table. The engine therefore uses
the nullable `species.bioload_rating` field. The active database constraint and
engine both accept scores from 1 through 10.

The service resolves selected species once through the existing species data
layer. The shared builder adapter maps those records into engine input. An
unresolved species or null/invalid rating remains uncalculated and makes the
analysis incomplete; it is never silently assigned zero bioload.

### Formulas

```text
baseCapacity = tankGallons

effectiveCapacity =
  baseCapacity * filtrationMultiplier * plantedMultiplier

totalBioload =
  sum(valid bioloadScore * valid quantity)

stockingPercentage =
  effectiveCapacity > 0
    ? totalBioload / effectiveCapacity * 100
    : 0

remainingCapacity = max(effectiveCapacity - totalBioload, 0)
capacityExceededBy = max(totalBioload - effectiveCapacity, 0)
```

The engine preserves the unrounded percentage. Display layers decide how to
round it.

### Status Thresholds

```text
0% through below 40%: Lightly Stocked
40% through below 70%: Moderately Stocked
70% through 100%: Fully Stocked
Above 100%: Overstocked
```

Exactly 100% is fully stocked. Overstocked results include a critical warning.

### Capacity Multipliers

Filtration:

```text
Low: 0.85
Standard: 1.0
High: 1.1
```

Planting:

```text
None: 1.0
Light: 1.03
Moderate: 1.07
Heavy: 1.1
```

Filtration and plants only modestly adjust effective capacity. They do not
change the intrinsic bioload produced by the livestock.

### Estimated Capacity Remaining

The engine calculates average bioload using only animals with valid scores and
quantities. Estimated remaining livestock is:

```text
floor(remainingCapacity / averageCurrentBioloadPerAnimal)
```

This estimates how many similarly demanding animals might fit. It is not an
exact number of safe additional fish and must not be presented as a guarantee.

### Incomplete Analysis and Warnings

The engine handles invalid input without throwing. Missing or invalid required
data sets `analysisComplete` to false and returns structured warnings. Current
warning categories cover:

- missing or invalid tank capacity
- unknown filtration or planted levels
- invalid livestock quantity
- missing stocking data
- invalid bioload score
- overstocking

Invalid quantities and missing/invalid scores do not contribute to calculated
bioload. `uncalculatedLivestockCount` exposes the affected amount.

### Service and UI Integration

`analyzeAquariumBuild()` resolves livestock, normalizes builder state, calls the
pure engine, and returns the result as `analysis.stocking`. The client builder
uses the same pure adapter and engine against its local in-progress state so the
display updates when tank, filter, plant, livestock, or quantity selections
change without client-side database access.

The UI shows utilization, status, total bioload, effective capacity, remaining
or exceeded capacity, estimated similarly demanding livestock remaining, and
incomplete-analysis warnings. Status is communicated with text as well as
color.

The builder compatibility summary is driven by the aquarium validation report.
It remains pending while the saved build loads, reports unavailable validation
honestly, and only shows a clean result after validation completes.

### Limitations and Relationship to M5 Issue 5

Stocking percentage is an estimate built from a coarse per-animal 1–10 score.
It is not a biological measurement, water-quality guarantee, or replacement
for aquarium-specific judgment. Plant counts do not yet represent plant mass,
growth rate, or nutrient uptake. Filter turnover does not capture media volume,
maintenance, head pressure, or actual biological filtration performance.

Compatibility and husbandry validation are handled separately. Temperature,
pH, hardness, minimum school size, aggression, territory, tank dimensions, and
swimming-zone congestion are not part of this engine. M5 Issue 5 can consume
this structured stocking result as one input to broader aquarium validation
without duplicating stocking calculations.


## Saved-Build Persistence Strategy

Saved-build persistence is intentionally out of scope for M5.

When persistence is added, saved builds should be stored separately from the core builder service and should expire after 14 days unless a later product decision introduces user accounts or permanent saves.

Expected future approach:

- add a saved-build persistence module outside the compatibility system
- store serialized `AquariumBuild` data plus metadata
- set `expires_at` to 14 days after creation
- periodically delete or ignore expired builds
- keep analysis reproducible by re-running the builder service against current species and compatibility data

The current `AquariumBuild` type includes optional metadata fields to support this future direction without requiring the builder model to be redesigned.

## Design Principles

- Keep the builder as an orchestration layer.
- Reuse existing services instead of duplicating logic.
- Keep compatibility calculations centralized.
- Prefer server-side use and static-friendly data flows.
- Keep the model practical and extensible.
- Avoid UI assumptions inside domain types.
- Avoid persistence assumptions inside analysis logic.
- Add future modules beside the current files rather than folding unrelated concerns into one large service.

## Why Compatibility Logic Is Reused

Compatibility is already handled by a dedicated service and engine.

The Compatibility Service:

- loads species
- applies water parameter data
- checks manual compatibility rules
- falls back to computed compatibility
- returns a consistent `CompatibilityResult`

Duplicating that work inside the Aquarium Builder would create multiple sources of truth and make future compatibility changes risky. By calling the Compatibility Service, the builder automatically benefits from improvements to compatibility rules, water parameter handling, and manual overrides.

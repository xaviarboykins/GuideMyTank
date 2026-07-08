# GuideMyTank Aquarium Builder

## Purpose

The Aquarium Builder is the backend foundation for GuideMyTank's flagship planning tool: a PCPartPicker-style builder for freshwater aquariums.

The builder should help users assemble a practical tank plan from reusable parts:

- tank configuration
- livestock
- equipment products
- estimated cost
- notes
- compatibility and stocking guidance

The builder is an orchestration layer. It should coordinate existing GuideMyTank services instead of reimplementing logic already owned elsewhere.

## Product Vision

The long-term product goal is "PCPartPicker for aquariums."

Users should eventually be able to choose a tank size, add fish, add equipment, review cost, spot compatibility problems, and save or share a build. The experience should remain ugly-but-useful: fast, searchable, practical, and focused on hobbyist decisions rather than visual polish.

## Current M5 Scope

Milestone 5 establishes the reusable backend domain model and service layer.

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
- lightweight stocking guidance from existing species data

This milestone does not add UI, routes, saved-build persistence, plants, starter kits, or affiliate-link behavior.

## Future Roadmap

The model is designed so future features can be added without redesigning the builder:

- live plants
- saved builds
- starter kits
- affiliate links
- richer stocking analysis
- equipment compatibility checks
- build sharing
- build templates

Future functionality should be added as new fields, modules, or services around the builder domain rather than by changing compatibility or species internals unnecessarily.

## Architecture

Builder code lives in:

```text
src/lib/aquarium-builder/
  types.ts
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
- provide lightweight stocking guidance using existing species fields
- return a unified `AquariumBuilderResult`

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

## Stocking Guidance

Dedicated `stocking_profiles` data is not currently available in the generated database types, and a migration dropped the legacy table.

For M5, stocking guidance is intentionally limited to existing species fields:

- warn when tank gallons are below a species minimum tank size
- recommend meeting minimum group size
- recommend caution when simple estimated bioload exceeds tank gallons

This is not a full stocking engine. A richer stocking model should be introduced later only when the data model supports it cleanly.

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

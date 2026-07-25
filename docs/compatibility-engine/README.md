# GuideMyTank Compatibility Engine

## Overview

The GuideMyTank compatibility engine is a deterministic, rule-based scoring system for comparing two aquarium species.

It returns:

- A numeric compatibility score from 0 to 100
- A compatibility status
- Human-readable reasons explaining the result

The goal is not to guarantee that two animals will coexist. The goal is to give hobbyists a fast, transparent planning signal that catches obvious husbandry conflicts before they buy livestock.

## Design Goals

- Deterministic: the same two species and the same data always produce the same result.
- Explainable: every result includes reasons tied to rule behavior.
- Conservative: severe behavior conflicts can override otherwise good water-parameter matches.
- Modular: each compatibility factor is isolated so new husbandry rules can be added without rewriting the engine.
- Useful over pretty: the result should help users avoid bad stocking choices.

## Current Evaluation Pipeline

`calculateCompatibility()` runs these checks:

1. Temperature compatibility
2. pH compatibility
3. Aggression and territorial compatibility
4. Schooling, shoaling, and group-size compatibility
5. Predation and invertebrate risk
6. Minimum tank-size compatibility
7. Structured water, setup, body-shape, and activity risk caps
8. Severe behavior risk caps

Most evaluators add points to the raw score. Predation and severe behavior rules can also apply a maximum score cap. This prevents cases where overlapping temperature, pH, tank size, and body size incorrectly make a dangerous pairing look compatible.

Example: a betta and a pea puffer may share temperature and pH ranges, but the puffer's specialist fin-nipping behavior plus the betta's slow, long-finned, territorial profile should cap the final score in the caution range.

Risk hierarchy:

1. Predation: one animal is likely to eat the other.
2. Temperament and social conflict: aggression level, territorial behavior, solitary fish with schooling fish.
3. Fin-nipping, attacking, or injury risk: usually caution unless predation also applies.
4. Other husbandry mismatches: flow, hardness, activity level, specialist tank style, and tank size.

## Scoring Weights

| Rule | Maximum Points |
| --- | ---: |
| Temperature | 20 |
| pH | 15 |
| Aggression | 25 |
| Schooling / social needs | 10 |
| Predation | 20 |
| Tank size | 10 |

The base score totals 100 points before behavior caps are applied.

## Compatibility Status Thresholds

| Score | Status |
| ---: | --- |
| 90-100 | High Compatibility |
| 70-89 | Compatible |
| 50-69 | Caution |
| 0-49 | Incompatible |

The score describes compatibility strength. Confidence is a separate
structured-data completeness measure: 75% comes from core size, tank,
temperature, pH, temperament, aggression, and compatibility-tag data; 25%
comes from contextual temperature, hardness, territory, activity, flow, and
tank-style data. A low compatibility score can therefore have high confidence.

## Rule Details

### Temperature Compatibility

Compares preferred temperature ranges.

True temperature conflicts apply a hard cap because there is no stable target temperature that satisfies both species. Narrow overlap is treated as caution, especially for species that already have specialist or stability-sensitive needs.

Typical reasons:

- Temperature ranges overlap well.
- Temperature ranges have limited overlap.
- Temperature requirements conflict.

### pH Compatibility

Compares preferred pH ranges.

pH conflicts apply a hard cap. Narrow overlap is treated as caution because a technically possible value is not always a stable long-term target for both fish.

Typical reasons:

- pH requirements overlap well.
- pH ranges have limited overlap.
- pH requirements conflict.

### Aggression and Territorial Compatibility

Compares temperament, numeric aggression level, and territorial tags.

Important behavior:

- Peaceful/semi-aggressive mixes are reduced but not automatically rejected.
- Aggressive species with peaceful species score poorly.
- Two territorial species with high combined aggression receive a severe penalty.

Typical reasons:

- Species have similar temperament.
- One species may be semi-aggressive and require planning.
- Both species are territorial with high aggression, creating a serious space conflict.

### Schooling, Shoaling, and Group-Size Compatibility

Uses `schooling`, `min_group_size`, and social tags such as `schooling`, `shoaling`, and `group`.

This rule should catch cases where one animal needs a same-species group while the other is solitary, territorial, or likely to be stressed by busy tankmates.

Typical reasons:

- Both species have compatible schooling or group behavior.
- One species should be maintained in a proper school or group.
- One species needs a group while the other is solitary or territorial.

### Predation Risk

Checks body-size difference, predator traits, mouth-gape risk, surface-predator behavior, aggressive large predators, invertebrate safety, and prey body shape.

Predation is treated as the highest-risk compatibility failure. If one species may eat the other, or if a fish is unsafe with an invertebrate, the final score is capped in the incompatible range.

Carnivorous diet alone is not enough to trigger predation. For example, bettas are carnivorous but should not be treated as generic predators of armored pygmy corys.

Body shape changes the predation threshold:

- `slender_prey_body` lowers the size ratio needed to flag predation.
- `deep_bodied` raises the threshold because the fish is harder to swallow.
- `armored_body` raises the threshold further and helps avoid false predation calls for corys, plecos, otocinclus, and similar fish.

Typical reasons:

- No predation risk detected.
- Size and diet create a predation risk.
- One species is not safe with invertebrates.

Current cap:

- Fish or invertebrate predation risk: capped at 40.

### Tank Size Compatibility

Compares minimum tank-size requirements.

Typical reasons:

- Tank size requirements align.
- Tank size requirements differ moderately.
- One species requires a significantly larger aquarium.

### Severe Behavior Risk Caps

Behavior caps are not normal point deductions. They apply a maximum possible score when the pair has a known high-risk pattern.

These are separate from predation. Fish attacking, stressing, fin-nipping, or injuring each other is an aggression/behavior problem, not a prey relationship. It is the second major risk category after predation, and it generally belongs in caution because spacing, cover, planting, stocking density, and individual behavior can change the outcome.

Current caps include:

- Two semi-aggressive or aggressive species: capped at 60 because neither
  should be presented as an unconditional community pairing.
- Puffer-family fish with non-puffer fish: capped at 60 because freshwater puffers are specialist fin-nipping hunters and poor community tankmates.
- Likely fin-nipper with long-finned or slow tankmate: capped at 60.
- Two highly aggressive territorial species: capped at 60.
- Territorial footprint and swimming-zone overlap: capped at 60.
- Breeding aggression in overlapping zones: capped at 60.
- Two solitary species where at least one is highly aggressive: capped at 60 unless predation also applies.
- Schooling or shoaling species with a solitary territorial tankmate: capped at 60 unless predation also applies.
- Closely related fish sharing a swimming zone where one is both territorial and solitary and their combined aggression is meaningful: capped at 60.

These caps exist because some husbandry conflicts are not solved by water-parameter overlap.

### No Species-Specific Production Rules

The production engine does not key compatibility decisions by Species slug or
canonical pair. Husbandry requirements must be represented through structured
Species fields, taxonomy, and general evaluators so newly added Species receive
the same treatment automatically.

Known regression pairs may exist in audit fixtures. They verify the generic
engine but never change its result.

## Data Signals Used Today

The engine currently uses fields from the `species` table:

- `min_temp_f`, `max_temp_f`
- `recommended_min_temp_f`, `recommended_max_temp_f`
- `tolerated_min_temp_f`, `tolerated_max_temp_f`
- `temp_source_notes`
- `data_confidence`
- `min_ph`, `max_ph`
- `tank_size_gal`
- `min_group_size`
- `temperament`
- `aggression_level`
- `schooling`
- `diet`
- `family`
- `invert_safe`
- `compatibility_tags`
- `max_size_inches`
- `flow_preference`
- `activity_level`
- `hardness_preference`
- `temperature_category`
- `preferred_tank_style`
- `territory_zone`
- `territory_footprint`
- `fin_nipping_risk`
- `long_fin_vulnerable`
- `slow_moving`
- `surface_predator`
- `mouth_gape_risk`
- `armored_body`
- `deep_bodied`
- `slender_prey_body`
- `specialist_setup`
- `delicate_species`
- `competitive_feeder`
- `species_only_preferred`
- `care_warnings`
- `breeding_aggression`
- `min_gh_dgh`, `max_gh_dgh`
- `min_kh_dkh`, `max_kh_dkh`
- `ph_stability_required`
- `summary` for user-facing Species context only

Compatibility decisions use structured trait fields. The production engine
does not parse summary wording to manufacture behavioral traits.

Oxygen demand has no Species schema field and does not currently change
compatibility results. GuideMyTank does not infer oxygen requirements from a
Species name, family, or generic activity level. A field should be added only
if future freshwater husbandry data demonstrates that it is needed.

Missing tank-style data is treated as unknown, not as a specialist-style
conflict. A setup conflict is applied only when both Species have explicit,
incompatible structured styles.

## Structured Trait Risk Caps

Structured trait caps are reusable compatibility checks backed by database columns.

Current structured caps include:

- Species-only preferred fish with other species: capped at 45.
- Softwater and hardwater preference conflict: capped at 60.
- GH or KH range conflict: capped at 60.
- Narrow pH, GH, or KH overlap with stability-sensitive species: capped at 60.
- Cool-water and warm-water preference conflict: capped at 60.
- Low-flow and high-flow preference conflict: capped at 60.
- Active, boisterous, or competitive feeders with slow, delicate, or long-finned species: capped at 60.
- Specialist tank style mismatch, such as stream, rockwork, goldfish, blackwater, predator, or species-only setups: capped at 60.

## Known-Pair Test Matrix

Compatibility changes should be checked against `data/compatibility/test-matrix.json` with:

```bash
npm run validate:compatibility
```

The matrix is grouped into:

- Known good
- Known caution
- Known bad
- Controversial/context-dependent

This is not a replacement for expert review, but it prevents obvious regressions such as treating harassment as predation or treating predator/prey pairings as compatible.

The matrix must contain at least 25% as many cases as there are species in `data/import/species.master.json`. With 100 species, the minimum matrix size is 25 known pairings.

The production compatibility service does not read `compatibility_rules`.
Every public result comes from structured Species data and generic evaluators.
Legacy rule rows therefore cannot replace, weaken, or strengthen a computed
classification.

`data/compatibility/expert-overrides.json` is intentionally empty. Its
validation and synchronization tooling is retained only for possible future
expert-review work and has no runtime effect. A future review system should
prefer recording agreement, disagreement, evidence, and engine regressions
instead of silently replacing the computed answer.

Use:

```bash
npm run validate:expert-overrides
npm run import:expert-overrides
```

The validator rejects unknown species, duplicate unordered pairs, missing
notes, invalid confidence values, invalid compatibility values, and entries
that are not explicitly expert validated. Use `--dry-run` to inspect the
database synchronization counts without changing rows:

```bash
npm run import:expert-overrides -- --dry-run
```

## Factors That Need Better Data Next

The pea puffer / betta issue happened because the engine knew general aggression and water overlap, but not enough specific behavior. Several broad trait fields now exist, but future improvements should still add more explicit data for:

- Shoaling vs schooling distinction
- Minimum same-species group size confidence
- Mouth-gape predation risk separate from adult length
- More specific aquascape needs such as dense planting, caves, smooth decor, sand depth, or rockwork
- Shrimp/snail predation separately from generic `invert_safe`
- More source-specific confidence, so user-facing results can distinguish strong consensus from rough default data

## Adding a New Compatibility Factor

1. Add or normalize the species data needed for the factor.
2. Create one focused evaluator in `src/lib/compatibility/engine.ts`.
3. Return points and clear reasons.
4. Use a score cap instead of only point deductions when the conflict should override otherwise good numeric matches.
5. Update this README with purpose, scoring behavior, assumptions, and example reasons.
6. Validate representative pairs, including at least one expected compatible pair and one expected incompatible pair.

## Representing an Unusual Species

1. Identify the biological or husbandry trait that makes the Species unusual.
2. Store that fact in an existing structured field or add a generally reusable
   field when necessary.
3. Evaluate the field without checking the Species name or slug.
4. Add representative fixtures proving that arbitrary Species with the same
   facts receive the same result.
5. Add known real-world pairs to the audit fixtures only as regressions.

## Guiding Philosophy

GuideMyTank should be conservative when animal welfare is at stake. A false "Compatible" result is worse than a cautious warning because it can encourage a user to buy animals that will stress, injure, or kill each other.

Compatibility scores are planning tools. Users should still verify care requirements, avoid overcrowding, quarantine new livestock when possible, and watch behavior after introduction.

## Aquarium Builder Context

The universal pair result describes whether two freshwater Species are
generally suitable tankmates. It does not change according to a particular
Builder selection.

The Aquarium Builder reuses that pair result and evaluates contextual facts
separately:

- selected tank volume;
- livestock quantities and minimum group sizes;
- total stocking;
- water-parameter overlap;
- heating and selected equipment;
- same-species and pair-level territorial evidence;
- predation evidence.

Builder findings must not overwrite compatibility rules or manufacture a
second pair score. This keeps compatibility reports canonical while allowing a
generally workable pair to fail in an undersized or incorrectly stocked build.

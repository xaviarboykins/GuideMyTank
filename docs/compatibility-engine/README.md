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
8. Species-specific special rules
9. Severe behavior risk caps

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
| 96-100 | Overwhelmingly Compatible |
| 90-95 | Very Compatible |
| 70-89 | Compatible |
| 50-69 | Caution |
| 0-49 | Incompatible |

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

- Other puffer with non-puffer fish: capped at 60 because freshwater puffers are specialist fin-nipping hunters and poor community tankmates.
- Likely fin-nipper with long-finned or slow tankmate: capped at 60.
- Two highly aggressive territorial species: capped at 60.
- Territorial footprint and swimming-zone overlap: capped at 60.
- Breeding aggression in overlapping zones: capped at 60.
- Two solitary species where at least one is highly aggressive: capped at 60 unless predation also applies.
- Schooling or shoaling species with a solitary territorial tankmate: capped at 60 unless predation also applies.

These caps exist because some husbandry conflicts are not solved by water-parameter overlap.

### Species-Specific Special Rules

Some species need named rules that are more specific than generic temperament, size, and tag checks. These live in `src/lib/compatibility/special-rules.ts`.

Use special rules when a species has well-known husbandry exceptions, such as:

- Species-only recommendations
- Narrow known tankmate candidates
- Specialist diet or hunting behavior
- Unusual territorial behavior
- Known incompatibilities that generic scoring would miss

Current special rules:

- Pea puffer with unsuitable tankmate: capped at 45 because pea puffers are best treated as species-only fish unless companions are fast, non-sedentary, and carefully selected.
- Pea puffer with narrow caution tankmate candidates, such as chili rasboras, clown killifish, zebra danios, or otocinclus catfish: capped at 60 and should still require a heavily planted aquarium.

When adding species in the future, first try to represent care needs with normal species data. Add a special rule only when a species has a known exception that generic data cannot model accurately.

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
- `summary` for limited text-pattern detection such as fin-nipping notes

Structured trait fields are preferred over parsing summary text. Summary text should be treated as a fallback only.

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

Manual rows in `compatibility_rules` are expert overrides when `expert_validated` is true. Expert-validated compatibility results display an `Expert validated` badge.

Expert overrides are maintained in `data/compatibility/expert-overrides.json`.

Use:

```bash
npm run validate:expert-overrides
npm run import:expert-overrides
```

The validator rejects unknown species, duplicate unordered pairs, missing notes, invalid confidence values, and invalid compatibility values.

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

## Adding a Species-Specific Rule

1. Add the rule to `src/lib/compatibility/special-rules.ts`.
2. Key it by `speciesSlug` so it only runs for the named species.
3. Keep the rule narrow and explainable.
4. Prefer a caution cap for manageable risk and an incompatible cap for predation or strongly unsuitable tankmates.
5. Add representative pair checks for the species, including an unsuitable pair and any known caution tankmate candidates.
6. Document the rule in this README.

## Guiding Philosophy

GuideMyTank should be conservative when animal welfare is at stake. A false "Compatible" result is worse than a cautious warning because it can encourage a user to buy animals that will stress, injure, or kill each other.

Compatibility scores are planning tools. Users should still verify care requirements, avoid overcrowding, quarantine new livestock when possible, and watch behavior after introduction.

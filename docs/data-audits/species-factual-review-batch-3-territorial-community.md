# Species Factual Review — Batch 3: Territorial Community Fish

Date: July 2026

Scope: Phase 11I review of territorial labyrinth fish, shark-like cyprinids, and higher-risk schooling fin nippers. This review changes only local import data and does not synchronize Supabase.

## Corrections

### Red Eye Tetra

- Updated the accepted scientific name from `Moenkhausia sanctaefilomenae` to `Bario sanctaefilomenae`.
- Updated the family from `Characidae` to `Acestrorhamphidae`.
- Retained `Moenkhausia sanctaefilomenae` as a searchable historical alias.
- Narrowed the recommended maximum temperature from 82 F to 79 F while retaining 82 F as tolerated.

FishBase currently accepts `Bario sanctaefilomenae` and reports 22–26 C.

### Siamese Algae Eater

- Changed `flow_preference` from `moderate` to `high`.

FishBase describes this species from clear hill streams and areas near rapids. This affects compatibility with slow-water specialists without requiring any named-pair rule.

### Moonlight Gourami

- Changed `flow_preference` from `moderate` to `low`.
- Narrowed the recommended lower temperature from 77 F to 79 F while retaining 77 F as tolerated.

FishBase describes shallow sluggish or standing, heavily vegetated water and a 26–30 C environmental range.

## Reviewed without changes

| Species | Finding |
| --- | --- |
| Betta | Solitary, territorial, low-flow, long-fin-vulnerable, and breeding-aggression traits remain appropriate. |
| Honey Gourami | Peaceful classification with a small top-zone breeding territory remains appropriate. |
| Serpae Tetra | Schooling, boisterous activity, competitive feeding, and fin-nipping risk remain appropriate. |
| Rainbow Shark | Solitary, large bottom territory, and similar-shape aggression warning remain appropriate. |
| Red Tail Shark | FishBase directly supports solitary aquarium keeping and adult territorial bullying. |
| Tiger Barb | FishBase directly advises group keeping and avoiding long-finned tankmates; current fin-risk traits remain appropriate. |
| Kissing Gourami | Large size, boisterous behavior, competitive feeding, and territorial display risk remain appropriate. |

## Deferred questions

1. Red Eye Tetras are sometimes reported as fin nippers in aquarium references, but the behavior is group- and context-dependent. The flag remains unchanged until stronger evidence distinguishes normal behavior from under-grouping.
2. “Siamese Algae Eater” is frequently misapplied in retail trade. This record describes `Crossocheilus oblongus`; lookalike flying foxes should not inherit its compatibility profile.
3. Gourami male aggression varies by sex, breeding state, cover, and surface territory. Existing generic top-zone and breeding-aggression fields should express this instead of globally treating all gouramis as aggressive.

## Sources

FishBase records were added for the reviewed species that previously relied exclusively on Wikipedia or general hobby sources. Exact URLs are maintained in `data/import/species.sources.json`.

## Synchronization status

Not synchronized. Phase 11I factual review continues before any database update is proposed.

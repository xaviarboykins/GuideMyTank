# Species Factual Review — Batch 1

Date: July 2026

Scope: the first risk-based Phase 11I review batch, covering predators, puffers, and specialist freshwater species. This review applies only to the local import dataset. It does not synchronize or modify Supabase.

## Review method

- Prefer taxonomy and natural-history references such as FishBase and university or industry-association publications.
- Use aquarium husbandry references only where a natural-history source does not answer a captive-care question.
- Correct a field only when the meaning of the field and the evidence are sufficiently clear.
- Defer disputed husbandry claims and schema limitations instead of encoding a named-pair exception.

## Species reviewed

| Species | Result | Notes |
| --- | --- | --- |
| Angelfish | Supported | Adult predation risk, territorial breeding behavior, warm freshwater range, and moderate-to-large body size are directionally supported. No field changed. |
| Cherry Shrimp | Corrected | `mouth_gape_risk` changed from `true` to `false`. This field identifies a predator capable of swallowing tankmates; Cherry Shrimp is instead vulnerable to fish predation. |
| Oscar | Supported | Large-bodied predatory cichlid classification and small-fish predation warning are supported. FishBase added to provenance. |
| Bubble Eye Goldfish | Corrected and deferred | `activity_level` changed from `active` to `calm`; `competitive_feeder` changed from `true` to `false`. Slow swimming and disadvantage during feeding are defining compatibility risks. `species_only_preferred` remains pending a richer generic way to represent compatibility with similarly slow fancy goldfish. |
| Black Ghost Knifefish | Provisionally supported | Large nocturnal predator/specialist classification is directionally consistent. Exact captive hardness, tank minimum, and medication sensitivity need a stronger dedicated husbandry reference in a later pass. |
| Freshwater Butterflyfish | Supported | Surface orientation, surface predation, calm-water preference, jumping risk, and small-fish predation are supported. |
| Pea Puffer | Deferred | Species-only/fin-nipping caution is supported across husbandry references, but the exact `schooling: true` and `min_group_size: 6` values remain disputed and were not changed without stronger evidence. |
| Golden Wonder Killifish | Corrected | Preferred maximum temperature narrowed from 82 F to 77 F using FishBase and EHEIM ranges. The existing 82 F maximum remains a tolerated value rather than a recommendation. Surface-predator classification is supported. |
| Rope Fish | Supported | Approximate 15-inch size, slow/standing-water habitat, escape risk, and predation of swallowable tankmates are supported. |
| Senegal Bichir | Provisionally supported | Predatory diet and large-tank classification are supported. The 14-inch aquarium size is retained because FishBase's larger wild maximum does not by itself establish a normal captive size. |

## Deferred modeling questions

1. Bubble Eye Goldfish can be housed with carefully matched slow fancy goldfish, but a single `species_only_preferred` boolean cannot express that cohort safely. This should be addressed with a generic specialist-cohort trait only if later batches show the same need across multiple species.
2. Pea Puffer social recommendations vary among aquarium references. Group-size data should not be changed until a reliable source distinguishes natural aggregation, captive minimum group size, and sex-ratio requirements.
3. Captive adult size and wild maximum length must remain distinct concepts. FishBase wild maxima should not automatically overwrite practical aquarium-profile sizes.

## Sources added

- FishBase species summaries for Oscar, Black Ghost Knifefish, Freshwater Butterflyfish, Pea Puffer, Golden Wonder Killifish, Rope Fish, and Senegal Bichir.
- University of Florida IFAS Cherry Shrimp profile.
- Ornamental Aquatic Trade Association fancy-goldfish care guidance.
- EHEIM Golden Wonder Killifish profile.

The exact URLs are maintained in `data/import/species.sources.json`.

## Synchronization status

Not synchronized. Phase 11I must continue through the remaining factual review batches before any database update is proposed.

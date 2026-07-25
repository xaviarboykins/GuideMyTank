# Species Factual Review — Batch 2: Cichlids

Date: July 2026

Scope: the second risk-based Phase 11I review batch. It covers the 13 local records in family `Cichlidae`, including Angelfish and Oscar previously examined in Batch 1. This review changes only the local import dataset and does not synchronize Supabase.

## Review method

- Validate scientific identity, native range, water parameters, adult size, feeding ecology, social structure, and breeding behavior.
- Prefer FishBase for taxonomy, natural range, wild environmental parameters, size, and feeding ecology.
- Keep wild environmental tolerance distinct from recommended captive conditions.
- Translate facts into general traits; do not encode named-pair compatibility outcomes.

## Corrections

### Green Severum

- Changed scientific identity from `Heros severus` to `Heros efasciatus`.
- Removed “Banded Cichlid” and `Heros severus` aliases, which describe a different and much less commonly traded species.
- Added `mouth_gape_risk: true` because this large cichlid can consume small fish.

The aquarium-trade Green Severum is generally referable to `Heros efasciatus`. True `Heros severus` is a distinct mouthbrooding species and should not be silently treated as the same fish.

### Keyhole Cichlid

- Changed `competitive_feeder` from `true` to `false`.

This species is consistently characterized as shy and peaceful. Marking it as a competitive feeder contradicted both that behavior and its local summary.

### Jack Dempsey Cichlid

- Added `mouth_gape_risk: true`.

FishBase documents fish among its foods, and its adult size makes predation on small tankmates a general size-and-diet risk rather than a named-pair exception.

## Reviewed without changes

| Species | Finding |
| --- | --- |
| Angelfish | Adult predation and breeding-territory traits remain supported. |
| German Blue Ram | Warm, soft, acidic water and paired aquarium keeping are supported. |
| Bolivian Ram | The cooler 22–26 C range and parental defense behavior are supported. |
| Kribensis | Cave territory and strong breeding defense remain appropriate generic traits. |
| Cockatoo Cichlid | Cave territory, carnivorous feeding, and breeding aggression remain appropriate. |
| Convict Cichlid | High territorial and breeding aggression remain strongly supported. |
| Oscar | Large-bodied predation risk remains supported. |
| Electric Yellow Cichlid | Lake Malawi specialist setup, hard alkaline water, rockwork, and multi-female social structure remain supported. |
| Discus | Warm, soft, acidic specialist conditions remain supported. Captive strains may tolerate conditions beyond the wild `S. discus` profile, so ranges were not broadened. |
| Firemouth Cichlid | Territorial breeding behavior and robust-tankmate caution remain supported. |

## Deferred questions

1. Common-name “Discus” may eventually need a broader genus-level or captive-strain model instead of representing every aquarium discus as wild-type `Symphysodon discus`.
2. Wild maximum length and common captive adult size remain separate concepts and should not be automatically merged.
3. Cichlid aggression is strongly dependent on breeding state, sex ratio, territory, and aquarium footprint. The existing generic breeding and territory fields should carry that context rather than globally labeling every dwarf cichlid aggressive.

## Sources

FishBase species summaries were added for all cichlid records in this batch that lacked them. Exact URLs are maintained in `data/import/species.sources.json`.

## Synchronization status

Not synchronized. The remaining Phase 11I factual batches must be reviewed before proposing a database import.

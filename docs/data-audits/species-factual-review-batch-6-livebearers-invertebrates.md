# Species Factual Review — Batch 6: Livebearers and Invertebrates

Date: July 2026

This local-only Phase 11I batch reviewed common livebearers, goodeids, shrimp, and freshwater snails.

## Findings

- Guppy, Endler, Platy, Swordtail, Molly, and Least Killifish records have compatible hard-water/community traits and meaningful social minimums.
- Butterfly Splitfin appropriately remains more boisterous and less universally community-safe than common poeciliids.
- Cherry, Amano, and Crystal Red Shrimp correctly remain prey-vulnerable rather than being treated as predators.
- Mystery and Nerite Snails retain hard-water shell-health requirements.
- Malaysian Trumpet Snail remains broadly tolerant; its invasive and population-growth concerns are husbandry issues rather than pair compatibility.

## Source improvements

FishBase records were added for Endler's Livebearer, Platy, Swordtail, Shortfin Molly, Sailfin Molly, Least Killifish, and Butterfly Splitfin. The Mystery Snail and Crystal Red Shrimp identity corrections were documented in Batch 4.

## Deferred modeling

- Livebearer sex ratio cannot be represented by `min_group_size` alone. A future generic sex-ratio field may be justified, but it is not required for the current compatibility MVP.
- Shrimp colony recommendations are not biological schooling and should eventually be modeled separately if group-validation messaging becomes more precise.
- Molly salinity tolerance does not make salt a requirement; GuideMyTank remains freshwater-only.

No additional master-data corrections were necessary in this batch, and no Supabase synchronization was performed.

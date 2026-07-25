# Phase 11I.3 Species Factual Review Follow-ups

## Outcome

All 26 medium-priority findings from the Phase 11I care-data audit were
reviewed and resolved locally.

- 24 findings were source-provenance gaps.
- Chili Rasbora's broad acidic pH range was retained as a valid blackwater
  range.
- Weather Loach's compatibility temperature recommendation was narrowed while
  retaining its broader tolerated range.

No named compatibility-pair overrides were introduced.

## Husbandry decisions

### Chili Rasbora

The existing pH range of 4.5–7.0 remains appropriate as a broad acidic
blackwater range. FishBase records a narrower captive/reference range, while
the Australian live-import assessment records peat-swamp conditions and a
broader acidic range. The audit now treats a broad range as expected when a
species is explicitly tagged `blackwater` and the maximum remains neutral or
acidic.

References:

- [FishBase: Boraras brigittae](https://www.fishbase.se/summary/boraras-brigittae.html)
- [Australian live-import assessment](https://www.dcceew.gov.au/sites/default/files/documents/draft-tor-boraras-brigittae.pdf)

### Weather Loach

The ecological/tolerated range remains 50–77 F. The recommended compatibility
range is now 59–72 F so the engine does not treat the full survival range as a
preferred community overlap.

References:

- [FishBase: Misgurnus anguillicaudatus](https://www.fishbase.org/summary/3016)
- [USGS Pond Loach species profile](https://nas.er.usgs.gov/queries/FactSheet.aspx?speciesID=498)

## Provenance improvements

Non-Wikipedia husbandry, fisheries, government, institutional, or taxonomic
references were added for the affected fish and invertebrates. High-confidence
Angelfish, Betta, Peppered Cory, Guppy, and Neon Tetra records now have at
least two references.

Representative sources include:

- FishBase species accounts
- University of Florida IFAS
- U.S. Geological Survey
- Australian Department of Climate Change, Energy, the Environment and Water
- MolluscaBase
- Seriously Fish species profiles

## Validation target

`npm run audit:species-data` must report:

- 0 high-priority flags
- 0 medium-priority flags
- 0 low-priority flags

Supabase synchronization is outside Phase 11I.3 and must occur only after this
local factual review is approved.

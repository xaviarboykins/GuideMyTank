# Species Biological Audit: Batch 2

Reviewed September 29, 2026. This batch completes the stronger-source review
queue identified by the database audit after Batch 1.

## Scope

- Bristlenose Pleco (`Ancistrus cirrhosus`)
- Yoyo Loach (`Botia almorhae`)
- Zebra Loach (`Botia striata`)
- Silver Dollar (`Metynnis argenteus`)
- Dwarf Gourami (`Trichogaster lalius`)
- Pearl Gourami (`Trichopodus leerii`)
- Sparkling Gourami (`Trichopsis pumila`)
- Paradise Fish (`Macropodus opercularis`)
- Three Spot Gourami (`Trichopodus trichopterus`)
- Boesemani Rainbowfish (`Melanotaenia boesemani`)
- Dwarf Neon Rainbowfish (`Melanotaenia praecox`)
- Wrestling Halfbeak (`Dermogenys pusilla`)
- Amano Shrimp (`Caridina multidentata`)
- Crystal Red Shrimp (`Caridina logemanni`)
- Ranchu Goldfish (`Carassius auratus`)
- Threadfin Rainbowfish (`Iriatherina werneri`)
- Celebes Rainbowfish (`Marosatherina ladigesi`)
- Lake Kutubu Rainbowfish (`Melanotaenia lacustris`)
- Oranda Goldfish (`Carassius auratus`)
- Black Moor Goldfish (`Carassius auratus`)

## Outcome

All twenty records now include an institutional or scientific-database
reference. Fish records were checked against FishBase, fancy goldfish care was
checked against the Ornamental Aquatic Trade Association care sheet, and the
two shrimp identities were checked against the World Register of Marine
Species.

Two high-confidence adult-size corrections were made:

- Yoyo Loach changed from 5 inches to 6.1 inches, matching the 15.5 cm maximum
  recorded by FishBase.
- Dwarf Gourami changed from 3 inches to 3.75 inches, matching the 9.5 cm
  maximum recorded by FishBase.

These corrections intentionally use maximum recorded adult size because that
is the safer input for tank-space, predation, and size-disparity checks.

## Values intentionally retained

- Bristlenose Pleco remains at 5 inches. The aquarium trade name can cover more
  than one `Ancistrus` form, so the narrower FishBase record for the selected
  species is not enough to reduce the safety-oriented care value.
- Wrestling Halfbeak remains at 3 inches. FishBase reports a 16.1 cm maximum
  for `Dermogenys pusilla`, but other members of the genus and commonly traded
  aquarium forms are substantially smaller. The discrepancy requires a
  specimen-specific husbandry source before changing compatibility behavior.
- Boesemani, Dwarf Neon, Threadfin, Celebes, and Lake Kutubu rainbowfish retain
  their established captive-care values where FishBase wild-environment data
  are narrower than practical aquarium guidance.
- Fancy goldfish retain variety-specific maximum sizes and a 30-gallon base
  tank recommendation. OATA confirms shared fancy-goldfish water requirements
  but does not publish breed-specific maximum sizes on the cited care sheet.
- Amano and Crystal Red Shrimp remain medium confidence. WoRMS establishes the
  accepted taxa, while their aquarium parameter ranges still rely on existing
  specialist husbandry references.

## Deployment follow-up

The Yoyo Loach and Dwarf Gourami corrections require migration
`20260929040000_correct_yoyo_loach_and_dwarf_gourami_sizes.sql`. Newly added
source references must also be synchronized with `npm run
import:species-sources` after deployment approval.

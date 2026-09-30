# Species Biological Audit: Batch 1

Reviewed September 29, 2026. This batch covers nine schooling fish whose
existing provenance relied on tertiary or commercial references.

## Scope

- Cardinal Tetra (`Paracheirodon axelrodi`)
- Ember Tetra (`Hyphessobrycon amandae`)
- Glowlight Tetra (`Hemigrammus erythrozonus`)
- Black Neon Tetra (`Hyphessobrycon herbertaxelrodi`)
- Congo Tetra (`Phenacogrammus interruptus`)
- Harlequin Rasbora (`Trigonostigma heteromorpha`)
- Scissortail Rasbora (`Rasbora trilineata`)
- Zebra Danio (`Danio rerio`)
- White Cloud Mountain Minnow (`Tanichthys albonubes`)

## Outcome

All nine records now include a FishBase species reference. Scientific names,
broad environmental ranges, social behavior, and recorded adult sizes were
compared with the canonical GuideMyTank data.

One high-confidence correction was made:

- Scissortail Rasbora adult maximum size changed from 4 inches to 5.1 inches.
  FishBase records a maximum total length of 13 cm. The larger value is the
  safer input for space and predation checks.

The Cardinal Tetra correction requires migrations
`20260929010000_correct_cardinal_tetra_temperature_range.sql` and
`20260929050000_align_cardinal_tetra_tolerated_temperature.sql` so its general,
recommended, and tolerated maximums all match the canonical 84°F value.

## Values retained pending a second husbandry source

Some FishBase environmental ranges are narrower than common captive-care
ranges. GuideMyTank therefore did not automatically replace aquarium ranges
for Cardinal Tetra, Harlequin Rasbora, Zebra Danio, or Congo Tetra solely from
wild-environment values. These records remain medium confidence until their
captive ranges and minimum tank dimensions receive a second specialist or
institutional reference.

## Reference records added

- FishBase species summaries for all nine audited species.
- Existing tertiary sources remain as secondary provenance; they are not used
  as the sole justification for promoting a record to high confidence.

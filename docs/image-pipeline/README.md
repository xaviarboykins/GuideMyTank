# Species Image Pipeline

## Purpose

Standardize all species images for GuideMyTank so every species uses a consistent, production-ready visual style.

---

## Final Production Rules

All production images must follow:

- WebP format
- 1200x1200 resolution
- Maximum 300KB file size
- Species centered in frame
- Consistent lighting and visual style
- Natural aquarium or neutral backgrounds are allowed
- Backgrounds must not obscure the species or introduce distracting subjects
- Production-ready for frontend rendering

---

## Directory Structure

assets/
  raw/
  processed/

data/
  import/
  images/

public/
  species/

docs/
  image-pipeline/

---

## Approved Image Source

Current approved source:

- Wikimedia Commons

Requirements:

- Verify public license before use
- Record attribution metadata before processing

---

## Manual Processing Workflow

Step 1  
Find source image from Wikimedia Commons

Step 2  
Verify image license

Step 3  
Download original image

Step 4  
Save original image to:

assets/raw/

Step 5  
Crop and clean up the source where necessary

Step 6  
Confirm the background is relevant and does not obscure the species

Step 7  
Resize image to:

1200x1200

Step 8

Convert image to WebP

Step 9

Compress image under:

300KB

Step 10

Save production asset to:

public/species/

---

## Metadata Updates

After processing update:

data/images/species-image-assets.json

Update:

- imageUrl
- alt
- status

And update:

data/images/species-image-sources.json

Update:

- source
- sourceUrl
- author
- license
- licenseUrl
- verified

---

## Naming Convention

All production assets use species slug.

Format:

slug.webp

Examples:

betta-splendens.webp  
neon-tetra.webp  
guppy.webp  
angelfish.webp

---

## Asset Lifecycle

SOURCE
↓
Wikimedia Commons

RAW
↓
assets/raw/

PROCESSING
↓
assets/processed/

METADATA
↓
data/images/

PRODUCTION
↓
public/species/

FRONTEND
↓
Species Detail Page  
Hover Preview  
Future Species Cards

---

## Repository workflow

The current controlled workflow is documented in
[`docs/species-image-workflow.md`](../species-image-workflow.md). Automated
sourcing may prepare draft review candidates, but it must never deploy or copy
an image into `public/species` before explicit human review. After the reviewer
records a complete batch decision, the PR workflow stages only approved images
inside that same automation PR. Production still requires human merges through
`dev` and then `main`; no local approval command is part of normal operation.


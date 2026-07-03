# Species Image Pipeline

## Purpose

Standardize all species images for GuideMyTank so every species uses a consistent, production-ready visual style.

---

## Final Production Rules

All production images must follow:

- Transparent background
- WebP format
- 1200x1200 resolution
- Maximum 300KB file size
- Species centered in frame
- Consistent lighting and visual style
- No aquarium backgrounds
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
Remove background

Step 6  
Perform manual cleanup using Photopea

Step 7  
Apply ChatGPT image polish / visual standardization

Step 8  
Perform final cleanup using Affinity Photo

Step 9  
Resize image to:

1200x1200

Step 10  
Convert image to WebP

Step 11  
Compress image under:

300KB

Step 12  
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

## Future Automation Pipeline

Future automated workflow:

Wikimedia API
↓
Auto image download
↓
AI background removal
↓
AI visual standardization
↓
Compression pipeline
↓
Metadata generation
↓
Automatic production deployment


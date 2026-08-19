# Species image workflow

GuideMyTank keeps approved species images at `public/species/{canonical-slug}.webp`. `placeholder.webp` is the controlled fallback. Candidates never enter that directory through automation.

## Automation policy

The GitHub Actions workflow runs once each Tuesday. Every run audits the repository first. It exits after uploading the audit when no species need images or when three successful sourcing runs have already occurred in the current UTC calendar month.

A sourcing run counts only when at least one candidate is downloaded and recorded. Dry runs, failed runs, and zero-success attempts do not count. Each batch is deterministic by canonical slug and contains no more than ten species. A species with an active or unresolved candidate is excluded from later selection until a human changes its manifest state.

Automated sourcing uses the Wikimedia Commons API. Imported creator and license metadata is evidence for review, not approval. The workflow opens a draft PR containing candidate material and provenance when practical. It never changes `public/species`.

## Commands

```bash
npm run species-images:audit
npm run species-image:validate -- path/to/image.webp
npm run species-image:prepare -- path/to/source.png neon-tetra
npm run species-images:source -- dry-run 10
npm run species-images:source -- 10
```

Audit reports are written to the ignored `reports/species-images/` directory. Candidate sources and prepared files stay under `assets/species-candidates/{slug}/`, outside production. The HTML review report shows candidates on light, dark, and checkerboard backgrounds. Reviewers must additionally inspect the image in representative species-detail, table-thumbnail, hover-preview, and Aquarium Builder dimensions.

## Human review

For every candidate, confirm:

1. The species identity and visible anatomy are correct.
2. One complete animal is shown where practical, with no text, watermark, aquarium background, or misleading reconstruction.
3. Edges and transparency are clean on light, dark, and checkerboard backgrounds.
4. The source URL, creator, license, license URL, and attribution are accurate.
5. Commercial use and modification rights have been reviewed manually.
6. The prepared image is square transparent WebP, at most 300 KB, with acceptable margins.

Record the reviewer, timestamp, attribution, both rights-review booleans, and notes in `species-image-candidates.json`. Then change the candidate state to `approved`. Do not approve solely because Wikimedia metadata was imported.

## Explicit publication or replacement

After the manifest change has received human review, the same recorded reviewer runs:

```bash
npm run species-image:approve -- neon-tetra "Reviewer Name"
```

Replacing an existing asset additionally requires a final `replace` argument. The command validates the prepared file, checks the complete rights review, copies the file into production, updates production metadata, and marks the candidate published. Commit those publication changes in a separate human-controlled PR.

If a candidate cannot be resolved, mark it `unresolved`; automation will not select that species again. To reconsider it, a human must deliberately change its state to `rejected` and document why.

Care Guide and article editorial images remain database-assigned content images delivered through `/media/content/...`. They are outside this workflow. Supabase Storage is not used for species images.

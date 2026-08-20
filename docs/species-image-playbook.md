# Species Image Pipeline Operator Playbook

This is the operating procedure for sourcing, reviewing, approving, rejecting, and deploying GuideMyTank species images.

## Controlled files

- Production: `public/species/{canonical-slug}.webp`
- Fallback: `public/species/placeholder.webp`
- Candidates: `assets/species-candidates/{canonical-slug}/`
- Batch decision: `data/images/species-image-review.json`
- Candidate history: `data/images/species-image-candidates.json`
- Production metadata: `species-image-assets.json` and `species-image-sources.json`
- Monthly accounting: `data/images/species-image-runs.json`

Care Guide images, article images, `/media/content/...`, Supabase Storage, and public uploads are outside this pipeline.

## Normal operation

1. GitHub runs **Species image audit and sourcing** every Tuesday.
2. The audit always runs first.
3. It stops when no species need images, the monthly limit is reached, or another review PR is open.
4. Otherwise it sources at most ten candidates and opens a draft `automation/species-images-*` PR into `dev`.

No production image is approved at this point.

## Manual Action modes

Open **GitHub -> Actions -> Species image audit and sourcing -> Run workflow**.

- **Run the audit without sourcing** only reports status.
- **Select a batch without downloading candidates** previews deterministic selection.
- Leave both disabled for real sourcing.

Only a real run that records at least one candidate counts toward the three-per-UTC-month limit.

## Review procedure

1. Open the draft automation PR and select **Files changed**.
2. Read `reports/species-images/review.md` and open its provenance links.
3. Inspect each `prepared.webp`; use `source.*` only to compare the original crop.
4. Confirm species identity, anatomy, crop, small-size clarity, and absence of text, watermark, or solid letterbox bars.
5. Confirm source, creator, attribution, license, commercial use, and modification rights.

The reviewer owns identity and rights decisions. Imported metadata is evidence, not approval.

## Record decisions

Edit `data/images/species-image-review.json` in the automation branch:

```json
{
  "schemaVersion": 1,
  "batchRunId": "do-not-change-this-value",
  "rightsConfirmed": true,
  "approved": [
    "amano-shrimp",
    "black-neon-tetra"
  ],
  "rejected": {
    "american-flagfish": "Incorrect image",
    "bristlenose-pleco": "Blurry at thumbnail size"
  },
  "replacements": []
}
```

- Do not change `batchRunId`.
- Every slug must appear exactly once: approved or rejected.
- Every rejection needs a useful reason.
- Set `rightsConfirmed` only after checking every approved item's rights.
- Leave `replacements` empty during ordinary new-image sourcing.

Commit the edit to the automation branch. **Apply species image review** runs automatically.

## What the review Action does

1. Matches the decision to the exact sourcing run.
2. Rejects missing, duplicate, overlapping, or out-of-batch decisions.
3. Requires complete provenance for approvals.
4. Records the GitHub actor and timestamp.
5. Validates each approved WebP.
6. Copies only approved images into `public/species` on the automation branch.
7. Updates candidate and production metadata.
8. Runs pipeline tests and the audit.
9. Commits the production changes to the same PR.

An untouched decision file changes nothing. Invalid or incomplete decisions fail closed.

## Merge and deploy

After the review Action finishes:

1. Refresh **Files changed**.
2. Confirm each approved slug has one new `public/species/{slug}.webp`.
3. Confirm rejected slugs do not appear in `public/species`.
4. Confirm approved candidates are `published` and rejected candidates are `rejected`.
5. Confirm checks pass, mark the draft ready, and merge into `dev`.
6. Open and review the normal `dev` to `main` release PR.
7. Merge it to deploy the approved images.

Merging into `dev` alone does not update production.

## Rejections and unresolved candidates

- Rejected candidates are not published and may be sourced again later.
- `unresolved` prevents reselection until a human deliberately changes the state.
- Rejection reasons should tell the next reviewer what failed.

## Replacements

Replacement is exceptional because it overwrites a canonical asset. Put the slug in both `approved` and `replacements`, then compare the old and new image in the final PR. The Action refuses an unlisted overwrite.

## Troubleshooting

### Source job did not run

Read the audit artifact. Expected causes are no eligible species, the 3/month limit, audit-only mode, or an existing automation PR.

### Candidate PR was not created

In **Settings -> Actions -> General**, confirm workflow read/write permission and permission for Actions to create pull requests. Then inspect Wikimedia/download errors in the source log.

### Review Action failed

Common causes are undecided or duplicate slugs, missing rejection reasons, incomplete license metadata, missing prepared files, solid padding, oversize output, or accidental replacement. Fix the same PR; never bypass validation by manually copying files.

### Framing is poor

Reject it. Automated preparation preserves the full source over a blurred extension, but human review still decides whether the subject is framed clearly at every supported size.

### Bad production deployment

Revert through the normal `dev` to `main` release path. Removing the canonical WebP safely restores the placeholder. Git history preserves recovery data.

## Branch synchronization

Normal operation needs no reverse sync because all candidate PRs enter `dev` first. If anyone commits directly to `main`, open a PR with base `dev` and compare `main`, then merge it before continuing development.

## Monthly checklist

- No more than three successful sourcing runs in the UTC month.
- No batch larger than ten.
- No abandoned automation PR.
- Production passes `npm run species-images:audit`.
- Unresolved candidates receive intentional review.

## Employee handoff checklist

The operator must be able to:

- explain automation PR -> `dev` -> `main`;
- run audit-only and dry-run modes;
- distinguish source files from prepared candidates;
- verify identity and usage rights;
- edit the decision file without changing its batch ID;
- inspect the final bot-generated production diff;
- explain why merging into `dev` does not deploy;
- complete a normal `dev` to `main` release;
- synchronize `main` back into `dev` after any bypass;
- stop and escalate uncertain identity or licensing.

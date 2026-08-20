# Species image workflow

GuideMyTank keeps approved species images at `public/species/{canonical-slug}.webp`. `placeholder.webp` is the controlled fallback. Care Guide editorial images and `/media/content/...` delivery are separate systems and are not changed by this workflow.

## Branch and publication flow

```text
scheduled/manual Action on main
  -> source from dev
  -> automation/species-images-* review PR into dev
  -> reviewer records one batch decision
  -> Action stages approved production assets in that PR
  -> human merges into dev
  -> normal dev-to-main release PR
  -> production deployment
```

The scheduled workflow definition runs from GitHub's default branch, but it explicitly checks out `dev`, creates its automation branch from `dev`, and targets the candidate PR to `dev`. Automation never commits directly to `dev` or `main`.

## Automation controls

- The audit runs once each Tuesday and can also be dispatched manually.
- The source job exits when no species need images.
- At most three successful sourcing runs are allowed per UTC calendar month.
- Dry runs, failures, and zero-success attempts do not count.
- At most ten species are selected in deterministic canonical-slug order.
- Active and unresolved candidates are not selected again.
- One automated review PR may be open at a time.
- Sourcing uses Wikimedia Commons and never approves copyright or species identity.
- Candidate assets remain under `assets/species-candidates` until explicit batch approval.
- Rejected and undecided candidates never enter `public/species`.

## Image rules

Production assets must be square WebP files no larger than 300 KB. Opaque photographs are cropped edge-to-edge with Sharp's attention strategy. Transparent sources retain transparent containment. Solid letterbox padding, text, watermarks, misleading reconstruction, bad anatomy, and poor crops are rejected. Natural aquarium and neutral backgrounds are allowed.

## Batch review

Every sourced PR contains `data/images/species-image-review.json`:

```json
{
  "schemaVersion": 1,
  "batchRunId": "generated-by-sourcing",
  "rightsConfirmed": false,
  "approved": [],
  "rejected": {},
  "replacements": []
}
```

The reviewer inspects every image and license, then puts every slug in either `approved` or `rejected`. Every rejection requires a reason. `rightsConfirmed` may become `true` only after the reviewer confirms commercial-use and modification rights for all approved candidates. `replacements` is reserved for deliberate replacement of existing production assets.

The PR review Action supplies the GitHub actor as reviewer, validates the entire decision, validates every approved WebP, records rights-review metadata, stages approved images and metadata in the same PR, and marks approved candidates published. It fails closed on incomplete or contradictory decisions.

## Commands

```bash
npm run species-images:audit
npm run species-image:validate -- path/to/image.webp
npm run species-image:prepare -- path/to/source.jpg canonical-slug
npm run species-images:source -- dry-run 10
npm run species-images:source -- 10
npm run species-images:apply-review -- "Reviewer Name"
```

The single-species `species-image:approve` command remains available as a recovery tool, but it is not part of normal operation.

See [species-image-playbook.md](./species-image-playbook.md) for the operator and employee handoff process.

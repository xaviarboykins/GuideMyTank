# Advertising integration

GuideMyTank uses a deliberately conservative Google AdSense integration. Ads
support the site but remain secondary to content and aquarium utilities.

## Current rollout status

- AdSense ownership is verified with the root `google-adsense-account` meta tag.
- Site review is pending in AdSense.
- Google CMP European and U.S. state messages are configured externally.
- `public/ads.txt` authorizes the GuideMyTank AdSense publisher account.
- Shared advertising components exist but no public placement is active.
- Auto Ads, overlays, anchors, vignettes, and interstitials remain disabled.

## Environment variables

Advertising is disabled unless all of the following are true:

1. `NODE_ENV` is `production`.
2. `ADVERTISING_ENABLED` is exactly `true`.
3. `GOOGLE_ADSENSE_CLIENT_ID` is a valid `ca-pub-` identifier.
4. The requested placement has a valid numeric slot ID.
5. The page family and minimum-content policy allow the placement.

See `.env.example` for the complete variable list. Configure production values
in Vercel. Keep advertising disabled in Development and Preview environments.

## Placement policy

Only these detail-page families are eligible:

- Articles
- Published Care Guides
- Published programmatic guides
- Full compatibility reports

The policy is an allowlist in `src/lib/advertising/policy.ts`. All other routes
are denied, including Aquarium Builder, admin, authentication, APIs, forms,
indexes, PDFs, previews, and short fallback pages.

## Component responsibilities

- `AdPlacement` applies configuration, page-family, and content-length policy.
- `AdSenseScript` loads the AdSense/CMP tag after primary rendering.
- `AdSlot` initializes one responsive slot, guards duplicate initialization,
  reserves responsive loading space, and collapses unfilled or failed slots.

Server-rendered page content remains usable when configuration is missing,
consent is declined, AdSense is blocked, the network fails, or a slot is
unfilled.

## ads.txt

The production file must be available at both the canonical URL and through the
apex-domain redirect:

```text
https://www.guidemytank.com/ads.txt
https://guidemytank.com/ads.txt
```

Expected content:

```text
google.com, pub-7577700971513069, DIRECT, f08c47fec0942fa0
```

After deployment, verify HTTP 200 and use AdSense **Sites → Check for updates**.

## Consent and privacy

Google CMP is configured with Consent, Do not consent, and Manage options.
Consent Mode is enabled for advertising and analytics purposes. Consent-message
optimization is disabled during the initial rollout. A U.S. state opt-out
message targets all current and future states supported by Google.

The Privacy Policy documents Google Analytics, AdSense, identifiers,
personalized and non-personalized ads, regional choices, and service-provider
processing. Legal review may still be appropriate as laws and business
practices change.

## Rollout order

1. Articles
2. Care Guides
3. Programmatic guides
4. Compatibility reports

Add one placement per eligible page family and stop for review after each
family. Do not add second placements until production UX and content-length
data justify them.

## Rollback

Set `ADVERTISING_ENABLED=false` in Vercel Production and redeploy. This removes
the AdSense script and slots while retaining ownership verification, ads.txt,
privacy disclosures, and external CMP configuration.

# Canonical host and URL rules

GuideMyTank's production origin is `https://www.guidemytank.com`.

## Application behavior

- `src/lib/seo/site-url.ts` is the single source of truth for absolute GuideMyTank URLs.
- `SITE_URL` is an optional server-side override. Values using either GuideMyTank hostname are normalized to HTTPS and `www`.
- Production defaults to the preferred origin. Development defaults to `http://localhost:3000`.
- Canonical URLs do not include query strings or fragments.
- Next.js uses no trailing slash by default and redirects trailing-slash variants.
- Compatibility species pairs are alphabetically ordered. Reversed pairs receive a permanent redirect.
- `/species/[slug]` is the canonical species-detail route. `/piscidex/[slug]` is a legacy alias that permanently redirects to it.
- CMS `canonical_url` values are retained in the database for compatibility but are not emitted publicly. Published articles and Care Guides self-canonicalize to their canonical GuideMyTank route.

## Host redirects

`next.config.ts` contains a permanent host-aware redirect from `guidemytank.com` to `https://www.guidemytank.com`, preserving the requested path and query string.

Vercel should also be configured at the domain layer:

1. Add both `guidemytank.com` and `www.guidemytank.com` to the project.
2. Set `www.guidemytank.com` as the primary production domain.
3. Configure `guidemytank.com` to redirect permanently to `www.guidemytank.com`.
4. Keep Vercel's HTTP-to-HTTPS redirect enabled.

The domain-layer redirect prevents requests from reaching the application on the apex host. The application redirect is a defense-in-depth fallback. Verify that production performs a single redirect rather than an HTTP-to-apex-to-`www` chain.

## Local verification

After starting the application, inspect representative canonical tags, `robots.txt`, and `sitemap.xml`. In production, verify:

- `http://guidemytank.com/example` redirects directly to `https://www.guidemytank.com/example`.
- `https://guidemytank.com/example` redirects to `https://www.guidemytank.com/example`.
- `https://www.guidemytank.com/example` does not redirect because of its hostname.
- `/piscidex/neon-tetra` redirects to `/species/neon-tetra`.

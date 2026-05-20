<!-- BEGIN:nextjs-agent-rules -->

# GuideMyTank Engineering Rules

## Project Philosophy

GuideMyTank is an ugly-but-useful aquarium utility website.

Priorities:
1. Utility
2. Speed
3. SEO
4. Maintainability
5. Scalability

Do NOT optimize for:
- flashy UI
- animations
- startup aesthetics
- social features
- overengineering

The site should feel similar to:
- PCPartPicker
- TractorData
- DiskPrices
- old-school searchable database websites

Modernized slightly with Tailwind and responsive design.

---

## Tech Stack

Frontend:
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui

Backend:
- Supabase
- PostgreSQL

Infrastructure:
- Vercel
- GitHub

---

## Architecture Rules

- Prefer Server Components by default
- Use Client Components only when necessary
- Prefer static rendering whenever possible
- Prefer server-side data fetching
- Avoid unnecessary state management libraries
- Avoid unnecessary useEffect usage
- Avoid unnecessary API routes
- Keep components small and composable
- Separate UI components from business logic

---

## UI Rules

- Utility-first design
- Functional over beautiful
- Dense information layouts are acceptable
- Prioritize readability and scanability
- Minimal animations
- Minimal gradients
- Minimal glassmorphism
- Avoid oversized hero sections
- Avoid startup-style marketing layouts

Preferred visual style:
- searchable database/tool
- old internet utility site
- modernized lightly

---

## SEO Rules

- Prioritize static pages
- Use semantic HTML
- Ensure crawlable content
- Prefer text content over client-rendered UI
- Optimize for long-tail search traffic
- Generate metadata properly
- Use proper heading hierarchy
- Keep pages fast

---

## Performance Rules

- Keep bundle sizes small
- Avoid unnecessary client-side JavaScript
- Lazy load heavy components
- Prefer simple solutions over clever ones
- Avoid unnecessary dependencies

---

## Folder Structure

Use:
src/
  app/
  components/
  lib/
  styles/
  types/

Group components by feature when appropriate.

---

## Forbidden Patterns

Do NOT:
- add Redux unless absolutely necessary
- overuse Context API
- create unnecessary abstractions
- add animations everywhere
- use heavy UI frameworks
- convert everything into client components
- create unnecessary wrappers/hooks

---

## Development Priorities

Always prioritize:
1. Maintainability
2. SEO
3. Simplicity
4. Performance
5. Scalability

Over:
- visual polish
- trendy patterns
- unnecessary complexity

---

## Next.js Version Warning

This project may use newer Next.js features than your training data.

Before implementing framework-specific logic:
- Check current App Router conventions
- Check current Next.js documentation
- Read deprecation warnings
- Verify modern patterns before coding

<!-- END:nextjs-agent-rules -->
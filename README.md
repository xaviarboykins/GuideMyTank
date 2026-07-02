# GuideMyTank
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Supabase](https://img.shields.io/badge/Supabase-Backend-green)
![Status](https://img.shields.io/badge/Status-MVP%20Development-orange)

GuideMyTank is a utility-first aquarium platform focused on practical tools for freshwater hobbyists.

Inspired by websites like:

- PCPartPicker
- TractorData
- DiskPrices

The platform focuses on:

- aquarium compatibility
- freshwater tank planning
- stocking calculators
- searchable species databases
- evergreen SEO traffic
- passive income through ads and affiliate links

GuideMyTank prioritizes:

- utility-first design
- fast performance
- maintainability
- SEO
- database-driven architecture
- functional over pretty UI

---

# Live Site

Production:

```txt
https://guidemytank.com
```

---

# Engineering Principles

This project follows several engineering constraints:

- Production-safe Git workflow
- Protected production branch (`main`)
- Development integration branch (`dev`)
- Feature branch isolation
- Static-first rendering where possible
- SEO-first architecture decisions
- Strong TypeScript typing
- Database-first schema design
- Utility-first product development

The goal is long-term maintainability over rapid feature development.

# Current Features

## Frontend Foundation

Completed:

- Next.js App Router setup
- TypeScript configuration
- Tailwind CSS setup
- shadcn/ui integration
- Responsive navigation
- Mobile navigation drawer
- Reusable layout architecture
- Utility-style homepage
- Metadata configuration
- robots.txt generation
- sitemap.xml generation
- Loading and not-found pages
- Accessible Radix UI components
- Hydration issue fixes
- ESLint cleanup and production linting fixes
- Responsive utility-first layout system
- Species search functionality
- Multi-filter PisciDex filtering system
- Combined client-side filtering logic
- Filter reset / clear filters functionality
- Responsive filter UI components

---

## Backend / Database Foundation

Completed:

- Supabase project setup
- PostgreSQL database initialization
- Environment variable configuration
- Public-read database architecture
- UUID-based schema design
- Typed Supabase integration
- Static/public Supabase client architecture
- Initial species table
- Species aliases/search table
- Compatibility rules table
- Tank size guidelines table
- Database indexes
- Typed query helper architecture
- Starter freshwater fish seed data
- Compatibility seed data
- Tank guideline seed data
- Verification queries completed successfully

---

## Static SEO + Data Architecture

Completed:

- Generated Supabase TypeScript types
- Typed data query helpers
- Static/server data fetching architecture
- Revalidation strategy
- Dynamic static species routes
- Dynamic compatibility routes
- SEO metadata generation
- Shared species UI components
- Shared compatibility UI components
- Static route generation strategy
- Compatibility query utilities
- OpenGraph metadata support
- Crawlable static page generation

---

## Infrastructure

Completed:

- GitHub repository setup
- GitHub branch workflow
- `main` production branch
- `dev` integration branch
- Branch protection for production
- Vercel deployment pipeline
- Production deployment
- Custom domain configuration
- HTTPS/SSL configuration
- Environment variable deployment configuration
- Production build verification
- Production lint verification

---

# Database Architecture

## Core Tables

### `species`

Canonical freshwater species database.

Includes:

- common names
- scientific names
- family, origin, and region
- pH and temperature ranges
- tank size, group size, and bioload rating
- temperament
- aggression level
- care level
- schooling behavior
- diet
- lifespan and breeding difficulty
- plant and invert safety
- compatibility tags
- local image paths
- summaries

The master source file is:

```txt
data/import/species.master.json
```

Species imports use the v2 flat schema documented in:

```txt
docs/species-import.md
```

### `species_aliases`

Search and SEO support table.

Used for:

- alternate names
- common misspellings
- scientific name lookups
- autocomplete support
- SEO search matching

### `compatibility_rules`

Species compatibility relationship system.

Supports:

- compatible
- caution
- incompatible

relationships with confidence scoring and notes.

### `tank_size_guidelines`

Tank recommendation rules system.

Supports:

- solo setups
- schooling requirements
- community recommendations
- future stocking calculations

---

# Core Sections

## PisciDex

Searchable freshwater species database.

Current functionality:

- database-backed species pages
- static SEO-generated routes
- species quick facts
- care information
- tank requirement data
- species search by name
- multi-filter species browsing
- filter reset functionality
- mobile responsive search/filter UI

Planned data includes:

- lifespan
- advanced water parameter logic
- compatibility recommendations
- filtration guidance
- beginner suitability

## Compatibility Checker

Tool for comparing aquarium species compatibility based on:

- aggression
- schooling behavior
- tank size
- water parameters
- activity level

Current functionality:

- static compatibility routes
- compatibility confidence system
- compatibility notes
- cross-linked species pages

## Stocking Planner

Utility for estimating aquarium stocking levels and identifying overcrowding risks.

Planned functionality:

- gallon-based stocking calculations
- filtration recommendations
- beginner warnings
- bioload estimation
- species grouping logic

---

# Tech Stack

## Frontend

- Next.js 16
- React 19
- TypeScript 5
- Tailwind CSS 4

## Backend / Data

- Supabase
- PostgreSQL
- Python ingestion scripts

## Infrastructure

- Vercel
- GitHub

---

# Architecture Philosophy

GuideMyTank is intentionally designed as a utility website rather than a startup-style application.

The goal is to create:

- searchable
- information-dense
- low-maintenance
- evergreen

tools for aquarium hobbyists.

The UI should feel similar to older internet database websites, lightly modernized with responsive design and modern frontend tooling.

GuideMyTank prioritizes:

- static generation
- server components
- lightweight pages
- crawlable content
- minimal client-side JavaScript

---

# Development Priorities

Priority order:

1. Utility
2. SEO
3. Maintainability
4. Performance
5. Scalability
6. Visual polish

Avoid:

- overengineering
- excessive animations
- unnecessary client-side state
- heavy frontend abstractions
- SaaS-style complexity
- unnecessary authentication systems

---

# Current Routes

```txt
/
 /piscidex
 /piscidex/[slug]
 /compatibility
 /compatibility/[speciesA]/[speciesB]
 /stocking
```

---

# Branch Workflow

GuideMyTank uses a lightweight Git workflow.

## Branches

```txt
main   → production
dev    → integration/staging
feature/* → issue/task branches
```

## Workflow

```txt
feature/* → dev → main
```

Production deployments are tied to the `main` branch.

---

# Local Development

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

with your browser to see the result.

---

# Planned Features

- autocomplete search
- pagination
- advanced stocking calculations
- aquarium gallon calculators
- filtration recommendations
- beginner aquarium guides
- affiliate integrations
- automated species ingestion pipelines
- species comparison tools
- tank planner utilities
- advanced compatibility matrix system
- sitemap expansion for generated pages

---

# Current Seed Data

Current starter species:

- Angelfish
- Betta
- Corydoras Catfish
- Guppy
- Honey Gourami
- Neon Tetra

---

# Current Status

GuideMyTank is currently in active MVP development and publicly deployed.

## Completed Milestones

### Milestone 1 — Project Foundation

Completed:

- Frontend initialization
- Responsive layout system
- SEO infrastructure
- Utility homepage
- Navigation system
- Supabase setup
- PostgreSQL schema
- Seed data initialization
- Compatibility data architecture
- Typed query architecture
- Static SEO route architecture
- Production deployment
- Custom domain setup
- GitHub workflow setup
- Branch protection setup

---

## Current Milestone

### Milestone 2 — PisciDex Species Database

In Progress

Completed:

- searchable species database
- species filtering system
- responsive filter UI
- /piscidex/[slug] routes
- compatibility relationship architecture
- SEO metadata generation
- species query architecture

Remaining:

- expanded species schema
- structured data support
- species ingestion pipeline
- bulk species import (100–150 species)
- autocomplete search
- pagination

---

# Long-Term Vision

GuideMyTank aims to become a low-maintenance evergreen aquarium utility platform similar in spirit to:

- PCPartPicker
- TractorData
- old internet database websites

with modern frontend performance and scalable SEO architecture.

The platform is intentionally designed to prioritize:

- evergreen search traffic
- information density
- utility-first UX
- low maintenance
- scalable database growth
- affiliate monetization opportunities
- static SEO performance

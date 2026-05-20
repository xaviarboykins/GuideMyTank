# GuideMyTank

GuideMyTank is an ugly-but-useful aquarium utility platform inspired by websites like:

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

- utility first design
- fast performance
- maintainability
- SEO
- database-driven architecture
- functional over pretty UI

---

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
- Accessibility warning fixes

---

## Backend / Database Foundation

Completed:

- Supabase project setup
- PostgreSQL database initialization
- Environment variable configuration
- Public-read database architecture
- UUID-based schema design
- Initial species table
- Species aliases/search table
- Compatibility rules table
- Tank size guidelines table
- Database indexes
- Starter freshwater fish seed data
- Compatibility seed data
- Tank guideline seed data
- Verification queries completed successfully

---

# Database Architecture

## Core Tables

### `species`

Canonical freshwater species database.

Includes:

- common names
- scientific names
- taxonomy
- temperament
- care level
- tank size requirements
- water parameters
- schooling behavior
- diet
- descriptions

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

Planned data includes:

- temperament
- care level
- tank size
- diet
- lifespan
- water parameters
- compatibility information

## Compatibility Checker

Tool for comparing aquarium species compatibility based on:

- aggression
- schooling behavior
- tank size
- water parameters
- activity level

## Stocking Planner

Utility for estimating aquarium stocking levels and identifying overcrowding risks.

---

# Tech Stack

## Frontend

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui

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

---

# Current Routes

```txt
/
 /piscidex
 /compatibility
 /stocking
```

---

# Local Development

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open:

```txt
http://localhost:3000
```

with your browser to see the result.

---

# Planned Features

- species detail pages
- static SEO-generated species pages
- compatibility matrix system
- advanced stocking calculations
- aquarium gallon calculators
- filtration recommendations
- beginner aquarium guides
- affiliate integrations
- automated species ingestion pipelines
- search and autocomplete
- species comparison tools
- tank planner utilities

---

# Current Seed Data

Current starter species:

- Betta
- Neon Tetra
- Corydoras Catfish
- Guppy
- Angelfish

---

# Current Status

GuideMyTank is currently in active MVP development.

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

## Current Milestone

### Milestone 1.5 — Backend / Data Architecture

In progress:

- typed Supabase integration
- query layer architecture
- static generation strategy
- SEO metadata generation
- dynamic species pages
- compatibility query system
- caching and revalidation strategy

---

# Long-Term Vision

GuideMyTank aims to become a low-maintenance evergreen aquarium utility platform similar in spirit to:

- PCPartPicker
- TractorData
- old internet database websites

with modern frontend performance and scalable SEO architecture.
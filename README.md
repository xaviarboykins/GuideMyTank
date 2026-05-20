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

- Next.js
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

# Project Philosophy

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

---

# Current Routes

```txt
/
 /piscidex
 /compatibility
 /stocking
```

## Local Development

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

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Planned Features
- species detail pages
- compatibility matrix system
- advanced stocking calculations
- tank parameter calculators
- filtration recommendations
- beginner aquarium guides
- affiliate integrations
- automated species ingestion pipelines
- SEO-generated species pages
- Status

GuideMyTank is currently in active MVP development.

Current milestone:

Milestone 1 — Project Foundation

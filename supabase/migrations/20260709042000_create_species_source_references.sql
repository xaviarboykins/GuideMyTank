create table if not exists public.species_source_references (
  id uuid primary key default gen_random_uuid(),
  species_id uuid not null references public.species(id) on delete cascade,
  source_url text not null,
  source_label text,
  source_category text not null default 'general',
  confidence text not null default 'medium',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint species_source_references_confidence_check
    check (confidence in ('low', 'medium', 'high')),
  constraint species_source_references_category_check
    check (
      source_category in (
        'general',
        'taxonomy',
        'water_parameters',
        'behavior',
        'compatibility',
        'care',
        'image'
      )
    ),
  constraint species_source_references_source_url_check
    check (source_url ~ '^https?://')
);

create unique index if not exists species_source_references_unique_source
  on public.species_source_references (species_id, source_category, source_url);

create index if not exists species_source_references_species_id_idx
  on public.species_source_references (species_id);

create index if not exists species_source_references_category_idx
  on public.species_source_references (source_category);

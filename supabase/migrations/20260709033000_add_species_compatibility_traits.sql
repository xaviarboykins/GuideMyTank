alter table public.species
  add column if not exists flow_preference text,
  add column if not exists activity_level text,
  add column if not exists hardness_preference text,
  add column if not exists temperature_category text,
  add column if not exists preferred_tank_style text,
  add column if not exists fin_nipping_risk boolean not null default false,
  add column if not exists long_fin_vulnerable boolean not null default false,
  add column if not exists slow_moving boolean not null default false,
  add column if not exists surface_predator boolean not null default false,
  add column if not exists mouth_gape_risk boolean not null default false,
  add column if not exists specialist_setup boolean not null default false,
  add column if not exists delicate_species boolean not null default false,
  add column if not exists competitive_feeder boolean not null default false,
  add column if not exists species_only_preferred boolean not null default false;

alter table public.species
  add constraint species_flow_preference_allowed
    check (
      flow_preference is null
      or flow_preference in ('low', 'moderate', 'high')
    ),
  add constraint species_activity_level_allowed
    check (
      activity_level is null
      or activity_level in ('calm', 'moderate', 'active', 'boisterous')
    ),
  add constraint species_hardness_preference_allowed
    check (
      hardness_preference is null
      or hardness_preference in ('soft', 'neutral', 'hard')
    ),
  add constraint species_temperature_category_allowed
    check (
      temperature_category is null
      or temperature_category in ('cool', 'tropical', 'warm')
    ),
  add constraint species_preferred_tank_style_allowed
    check (
      preferred_tank_style is null
      or preferred_tank_style in (
        'blackwater',
        'community',
        'goldfish',
        'planted',
        'predator',
        'rockwork',
        'species_only',
        'stream'
      )
    );

create index if not exists species_flow_preference_idx
  on public.species (flow_preference);

create index if not exists species_activity_level_idx
  on public.species (activity_level);

create index if not exists species_hardness_preference_idx
  on public.species (hardness_preference);

create index if not exists species_temperature_category_idx
  on public.species (temperature_category);

create index if not exists species_preferred_tank_style_idx
  on public.species (preferred_tank_style);

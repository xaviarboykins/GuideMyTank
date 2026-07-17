create table if not exists public.plants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  common_name text not null,
  scientific_name text not null,
  description text,

  care_level text not null,
  growth_rate text,
  placement text,

  minimum_tank_gallons numeric,
  minimum_temperature_f numeric,
  maximum_temperature_f numeric,
  minimum_ph numeric,
  maximum_ph numeric,
  minimum_light_level text,
  maximum_light_level text,
  co2_required boolean not null default false,
  maximum_height_inches numeric,

  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint plants_slug_format
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint plants_common_name_not_blank
    check (btrim(common_name) <> ''),
  constraint plants_scientific_name_not_blank
    check (btrim(scientific_name) <> ''),
  constraint plants_care_level_allowed
    check (care_level in ('beginner', 'intermediate', 'advanced')),
  constraint plants_growth_rate_allowed
    check (
      growth_rate is null
      or growth_rate in ('slow', 'moderate', 'fast')
    ),
  constraint plants_placement_allowed
    check (
      placement is null
      or placement in (
        'foreground',
        'midground',
        'background',
        'floating',
        'epiphyte'
      )
    ),
  constraint plants_minimum_tank_positive
    check (minimum_tank_gallons is null or minimum_tank_gallons > 0),
  constraint plants_minimum_temperature_valid
    check (
      minimum_temperature_f is null
      or minimum_temperature_f > 32
    ),
  constraint plants_maximum_temperature_valid
    check (
      maximum_temperature_f is null
      or maximum_temperature_f > 32
    ),
  constraint plants_temperature_range_valid
    check (
      minimum_temperature_f is null
      or maximum_temperature_f is null
      or minimum_temperature_f <= maximum_temperature_f
    ),
  constraint plants_minimum_ph_valid
    check (minimum_ph is null or minimum_ph between 0 and 14),
  constraint plants_maximum_ph_valid
    check (maximum_ph is null or maximum_ph between 0 and 14),
  constraint plants_ph_range_valid
    check (
      minimum_ph is null
      or maximum_ph is null
      or minimum_ph <= maximum_ph
    ),
  constraint plants_minimum_light_level_allowed
    check (
      minimum_light_level is null
      or minimum_light_level in ('low', 'medium', 'high')
    ),
  constraint plants_maximum_light_level_allowed
    check (
      maximum_light_level is null
      or maximum_light_level in ('low', 'medium', 'high')
    ),
  constraint plants_light_level_range_valid
    check (
      minimum_light_level is null
      or maximum_light_level is null
      or array_position(
        array['low', 'medium', 'high']::text[],
        minimum_light_level
      ) <= array_position(
        array['low', 'medium', 'high']::text[],
        maximum_light_level
      )
    ),
  constraint plants_maximum_height_positive
    check (maximum_height_inches is null or maximum_height_inches > 0)
);

create index if not exists plants_common_name_idx
  on public.plants (common_name);

create index if not exists plants_scientific_name_idx
  on public.plants (scientific_name);

create index if not exists plants_is_active_idx
  on public.plants (is_active);

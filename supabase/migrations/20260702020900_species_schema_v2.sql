alter table public.species
  rename column origin_region to origin;

alter table public.species
  rename column min_tank_gallons to tank_size_gal;

alter table public.species
  rename column minimum_group_size to min_group_size;

alter table public.species
  rename column short_description to summary;

alter table public.species
  drop column if exists category;

alter table public.species
  drop column if exists reef_safe;

alter table public.species
  add column if not exists region text,
  add column if not exists bioload_rating integer,
  add column if not exists aggression_level integer,
  add column if not exists lifespan_years numeric,
  add column if not exists breeding_difficulty text,
  add column if not exists plant_safe boolean,
  add column if not exists invert_safe boolean,
  add column if not exists compatibility_tags text[] not null default '{}',
  add column if not exists image_url text;

update public.species
set care_level = 'Easy'
where care_level = 'Beginner';

update public.species
set care_level = 'Intermediate'
where care_level = 'Moderate';

update public.species
set scientific_name = common_name
where scientific_name is null;

alter table public.species
  alter column scientific_name set not null;

alter table public.species
  add constraint species_temperament_allowed
    check (
      temperament is null
      or temperament in ('Peaceful', 'Semi-Aggressive', 'Aggressive')
    ),
  add constraint species_diet_allowed
    check (
      diet is null
      or diet in ('Carnivore', 'Herbivore', 'Omnivore')
    ),
  add constraint species_care_level_allowed
    check (
      care_level is null
      or care_level in ('Easy', 'Intermediate', 'Advanced')
    ),
  add constraint species_bioload_rating_range
    check (bioload_rating is null or bioload_rating between 1 and 10),
  add constraint species_aggression_level_range
    check (aggression_level is null or aggression_level between 1 and 10),
  add constraint species_lifespan_years_positive
    check (lifespan_years is null or lifespan_years > 0),
  add constraint species_image_url_local
    check (
      image_url is null
      or image_url ~ '^/species/[a-z0-9]+(-[a-z0-9]+)*\.webp$'
    ),
  add constraint species_compatibility_tags_allowed
    check (
      compatibility_tags <@ array[
        'community',
        'nano_tank',
        'large_tank',
        'peaceful',
        'semi_aggressive',
        'aggressive',
        'schooling',
        'solitary',
        'territorial',
        'bottom_dweller',
        'mid_water',
        'top_water',
        'plant_safe',
        'invert_safe',
        'shrimp_safe',
        'beginner_friendly',
        'blackwater',
        'hardwater',
        'softwater',
        'sand_preferred',
        'rockwork_preferred'
      ]::text[]
    );

create index if not exists species_tank_size_gal_idx
  on public.species (tank_size_gal);

create index if not exists species_care_level_idx
  on public.species (care_level);

create index if not exists species_temperament_idx
  on public.species (temperament);

create index if not exists species_compatibility_tags_idx
  on public.species using gin (compatibility_tags);

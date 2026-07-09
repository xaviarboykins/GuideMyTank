alter table public.species
  add column if not exists armored_body boolean not null default false,
  add column if not exists deep_bodied boolean not null default false,
  add column if not exists slender_prey_body boolean not null default false,
  add column if not exists territory_zone text,
  add column if not exists territory_footprint text,
  add column if not exists breeding_aggression boolean not null default false,
  add column if not exists min_gh_dgh numeric,
  add column if not exists max_gh_dgh numeric,
  add column if not exists min_kh_dkh numeric,
  add column if not exists max_kh_dkh numeric,
  add column if not exists ph_stability_required boolean not null default false;

alter table public.species
  add constraint species_territory_zone_check
    check (
      territory_zone is null or
      territory_zone in ('none', 'top', 'mid', 'bottom', 'cave', 'open', 'all')
    ),
  add constraint species_territory_footprint_check
    check (
      territory_footprint is null or
      territory_footprint in ('none', 'small', 'medium', 'large')
    ),
  add constraint species_gh_range_check
    check (
      min_gh_dgh is null or
      max_gh_dgh is null or
      min_gh_dgh <= max_gh_dgh
    ),
  add constraint species_kh_range_check
    check (
      min_kh_dkh is null or
      max_kh_dkh is null or
      min_kh_dkh <= max_kh_dkh
    );

create index if not exists species_territory_zone_idx
  on public.species (territory_zone);

create index if not exists species_territory_footprint_idx
  on public.species (territory_footprint);

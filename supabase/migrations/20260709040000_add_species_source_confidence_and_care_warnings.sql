alter table public.species
  add column if not exists data_confidence text not null default 'medium',
  add column if not exists temp_source_notes text,
  add column if not exists recommended_min_temp_f numeric,
  add column if not exists recommended_max_temp_f numeric,
  add column if not exists tolerated_min_temp_f numeric,
  add column if not exists tolerated_max_temp_f numeric,
  add column if not exists care_warnings text[] not null default '{}';

alter table public.species
  add constraint species_data_confidence_check
    check (data_confidence in ('low', 'medium', 'high')),
  add constraint species_recommended_temp_range_check
    check (
      recommended_min_temp_f is null or
      recommended_max_temp_f is null or
      recommended_min_temp_f <= recommended_max_temp_f
    ),
  add constraint species_tolerated_temp_range_check
    check (
      tolerated_min_temp_f is null or
      tolerated_max_temp_f is null or
      tolerated_min_temp_f <= tolerated_max_temp_f
    );

create index if not exists species_data_confidence_idx
  on public.species (data_confidence);

create table if not exists public.water_parameters (
  id uuid primary key default gen_random_uuid(),
  species_id uuid not null references public.species(id) on delete cascade,

  min_temp_f numeric,
  max_temp_f numeric,

  min_ph numeric,
  max_ph numeric,

  min_hardness_dgh numeric,
  max_hardness_dgh numeric,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint water_parameters_species_id_unique unique (species_id)
);

create index if not exists water_parameters_species_id_idx
on public.water_parameters(species_id);

insert into public.water_parameters (
  species_id,
  min_temp_f,
  max_temp_f,
  min_ph,
  max_ph
)
select
  id,
  min_temp_f,
  max_temp_f,
  min_ph,
  max_ph
from public.species
on conflict (species_id) do update
set
  min_temp_f = excluded.min_temp_f,
  max_temp_f = excluded.max_temp_f,
  min_ph = excluded.min_ph,
  max_ph = excluded.max_ph,
  updated_at = now();
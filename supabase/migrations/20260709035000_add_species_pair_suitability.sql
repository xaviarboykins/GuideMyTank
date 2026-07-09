alter table public.species
  add column if not exists bonded_pair_suitable boolean not null default false;

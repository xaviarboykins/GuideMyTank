alter table public.species_source_references enable row level security;

drop policy if exists "Public reads Species source references"
  on public.species_source_references;

create policy "Public reads Species source references"
  on public.species_source_references
  for select
  to anon, authenticated
  using (true);

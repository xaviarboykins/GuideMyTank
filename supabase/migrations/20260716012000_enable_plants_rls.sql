alter table public.plants enable row level security;

drop policy if exists "Public can read active plants"
  on public.plants;

create policy "Public can read active plants"
  on public.plants
  for select
  using (is_active = true);

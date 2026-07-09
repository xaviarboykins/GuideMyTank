alter table public.products enable row level security;

drop policy if exists "Public can read active products"
  on public.products;

create policy "Public can read active products"
  on public.products
  for select
  using (is_active = true);

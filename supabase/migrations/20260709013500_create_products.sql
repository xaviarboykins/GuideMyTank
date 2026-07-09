create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  category text not null,
  brand text not null,
  model text,
  title text not null,
  description text,
  short_description text,
  image_url text,

  recommended_tank_min_gallons numeric,
  recommended_tank_max_gallons numeric,

  freshwater boolean not null default true,
  saltwater boolean not null default false,
  planted_tank boolean not null default false,

  flow_rate_gph numeric,
  heater_watts numeric,
  light_type text,
  light_output text,
  substrate_type text,
  dimensions text,

  price_estimate numeric,
  guide_rating numeric,
  difficulty text,

  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint products_category_allowed
    check (
      category in (
        'tanks',
        'filters',
        'heaters',
        'lighting',
        'substrate',
        'decor'
      )
    ),
  constraint products_tank_min_positive
    check (
      recommended_tank_min_gallons is null
      or recommended_tank_min_gallons > 0
    ),
  constraint products_tank_max_positive
    check (
      recommended_tank_max_gallons is null
      or recommended_tank_max_gallons > 0
    ),
  constraint products_tank_range_valid
    check (
      recommended_tank_min_gallons is null
      or recommended_tank_max_gallons is null
      or recommended_tank_min_gallons <= recommended_tank_max_gallons
    ),
  constraint products_flow_rate_positive
    check (flow_rate_gph is null or flow_rate_gph > 0),
  constraint products_heater_watts_positive
    check (heater_watts is null or heater_watts > 0),
  constraint products_price_estimate_positive
    check (price_estimate is null or price_estimate >= 0),
  constraint products_guide_rating_range
    check (guide_rating is null or guide_rating between 1 and 5),
  constraint products_difficulty_allowed
    check (
      difficulty is null
      or difficulty in ('beginner', 'intermediate', 'advanced')
    )
);

create index if not exists products_slug_idx
  on public.products (slug);

create index if not exists products_category_idx
  on public.products (category);

create index if not exists products_brand_idx
  on public.products (brand);

create index if not exists products_is_active_idx
  on public.products (is_active);

create index if not exists products_recommended_tank_range_idx
  on public.products (
    recommended_tank_min_gallons,
    recommended_tank_max_gallons
  );

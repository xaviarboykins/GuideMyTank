alter table public.articles
  add column include_products boolean not null default false,
  add column product_category text;

alter table public.articles
  add constraint articles_product_category_check
  check (
    product_category is null
    or product_category in (
      'tanks',
      'filters',
      'heaters',
      'lighting',
      'substrate',
      'decor'
    )
  );

comment on column public.articles.include_products is
  'Editorial opt-in for displaying a product-category link on the public article.';

comment on column public.articles.product_category is
  'Optional GuideMyTank product category displayed when include_products is true.';

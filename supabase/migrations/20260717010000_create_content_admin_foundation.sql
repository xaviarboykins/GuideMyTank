-- Milestone 6, Issue 2: separate Care Guide and Article content workflows.
-- Uploaded content assets live in the private `content-images` storage bucket.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create table public.content_images (
  id uuid primary key default gen_random_uuid(),
  species_id uuid references public.species(id) on delete restrict,
  storage_path text not null unique,
  alt_text text,
  caption text,
  attribution text,
  source_url text,
  author text,
  license_name text,
  license_url text,
  width integer,
  height integer,
  mime_type text,
  file_size_bytes bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_images_storage_path_valid
    check (storage_path ~ '^[a-zA-Z0-9][a-zA-Z0-9/_-]*\.[a-zA-Z0-9]+$'),
  constraint content_images_source_url_valid
    check (source_url is null or source_url ~ '^https?://'),
  constraint content_images_license_url_valid
    check (license_url is null or license_url ~ '^https?://'),
  constraint content_images_width_positive check (width is null or width > 0),
  constraint content_images_height_positive check (height is null or height > 0),
  constraint content_images_file_size_positive
    check (file_size_bytes is null or file_size_bytes > 0)
);

create table public.care_guides (
  id uuid primary key default gen_random_uuid(),
  species_id uuid not null unique references public.species(id) on delete restrict,
  title text,
  slug text unique,
  summary text,
  status text not null default 'draft',
  published_at timestamptz,
  seo_title text,
  meta_description text,
  canonical_url text,
  open_graph_image_id uuid references public.content_images(id) on delete set null,
  is_featured boolean not null default false,
  quick_facts jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint care_guides_title_not_blank check (title is null or btrim(title) <> ''),
  constraint care_guides_slug_format
    check (slug is null or slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint care_guides_summary_not_blank check (summary is null or btrim(summary) <> ''),
  constraint care_guides_status_allowed check (status in ('draft', 'published', 'archived')),
  constraint care_guides_published_at_consistent
    check (status <> 'published' or published_at is not null),
  constraint care_guides_canonical_url_valid
    check (canonical_url is null or canonical_url ~ '^https?://')
);

create table public.care_guide_sections (
  id uuid primary key default gen_random_uuid(),
  care_guide_id uuid not null references public.care_guides(id) on delete cascade,
  section_type text not null,
  heading text,
  content jsonb not null default '{}'::jsonb,
  display_order integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint care_guide_sections_type_allowed check (section_type in (
    'overview', 'natural_habitat', 'adult_size_and_lifespan',
    'aquarium_requirements', 'water_parameters', 'filtration_and_flow',
    'heating_requirements', 'lighting', 'substrate', 'plants_and_decor',
    'behavior_and_temperament', 'social_requirements', 'tank_mates',
    'species_to_avoid', 'diet_and_feeding', 'common_health_concerns',
    'breeding', 'beginner_guidance', 'frequently_asked_questions'
  )),
  constraint care_guide_sections_order_nonnegative check (display_order >= 0),
  unique (care_guide_id, section_type),
  unique (care_guide_id, display_order)
);

create table public.care_guide_images (
  care_guide_id uuid not null references public.care_guides(id) on delete cascade,
  image_id uuid not null references public.content_images(id) on delete restrict,
  is_primary boolean not null default false,
  display_order integer not null,
  created_at timestamptz not null default now(),
  primary key (care_guide_id, image_id),
  constraint care_guide_images_order_nonnegative check (display_order >= 0),
  unique (care_guide_id, display_order)
);

create unique index care_guide_images_one_primary_idx
  on public.care_guide_images (care_guide_id)
  where is_primary;

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  publisher text,
  author text,
  url text,
  publication_date date,
  accessed_date date,
  source_type text not null default 'website',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sources_title_not_blank check (btrim(title) <> ''),
  constraint sources_url_valid check (url is null or url ~ '^https?://'),
  constraint sources_type_allowed check (source_type in (
    'website', 'book', 'journal', 'organization', 'database', 'other'
  ))
);

create unique index sources_url_unique_idx on public.sources (url) where url is not null;

create table public.care_guide_sources (
  care_guide_id uuid not null references public.care_guides(id) on delete cascade,
  source_id uuid not null references public.sources(id) on delete restrict,
  citation_label text,
  display_order integer not null,
  primary key (care_guide_id, source_id),
  constraint care_guide_sources_order_nonnegative check (display_order >= 0),
  unique (care_guide_id, display_order)
);

create table public.care_guide_related_species (
  care_guide_id uuid not null references public.care_guides(id) on delete cascade,
  species_id uuid not null references public.species(id) on delete restrict,
  relationship_label text,
  display_order integer not null,
  primary key (care_guide_id, species_id),
  constraint care_guide_related_species_order_nonnegative check (display_order >= 0),
  unique (care_guide_id, display_order)
);

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  title text,
  slug text unique,
  summary text,
  status text not null default 'draft',
  published_at timestamptz,
  seo_title text,
  meta_description text,
  canonical_url text,
  featured_image_id uuid references public.content_images(id) on delete set null,
  open_graph_image_id uuid references public.content_images(id) on delete set null,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint articles_title_not_blank check (title is null or btrim(title) <> ''),
  constraint articles_slug_format
    check (slug is null or slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint articles_summary_not_blank check (summary is null or btrim(summary) <> ''),
  constraint articles_status_allowed check (status in ('draft', 'published', 'archived')),
  constraint articles_published_at_consistent
    check (status <> 'published' or published_at is not null),
  constraint articles_canonical_url_valid
    check (canonical_url is null or canonical_url ~ '^https?://')
);

create table public.article_sections (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  block_type text not null,
  content jsonb not null default '{}'::jsonb,
  display_order integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint article_sections_type_allowed check (block_type in (
    'heading', 'paragraph', 'list', 'comparison_table', 'tip', 'warning',
    'faq_group', 'image', 'related_content'
  )),
  constraint article_sections_order_nonnegative check (display_order >= 0),
  unique (article_id, display_order)
);

create table public.article_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint article_categories_name_not_blank check (btrim(name) <> ''),
  constraint article_categories_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create unique index article_categories_name_unique_idx on public.article_categories (lower(name));

create table public.article_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint article_tags_name_not_blank check (btrim(name) <> ''),
  constraint article_tags_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create unique index article_tags_name_unique_idx on public.article_tags (lower(name));

create table public.article_category_assignments (
  article_id uuid not null references public.articles(id) on delete cascade,
  category_id uuid not null references public.article_categories(id) on delete restrict,
  primary key (article_id, category_id)
);

create table public.article_tag_assignments (
  article_id uuid not null references public.articles(id) on delete cascade,
  tag_id uuid not null references public.article_tags(id) on delete restrict,
  primary key (article_id, tag_id)
);

create table public.article_images (
  article_id uuid not null references public.articles(id) on delete cascade,
  image_id uuid not null references public.content_images(id) on delete restrict,
  display_order integer not null,
  primary key (article_id, image_id),
  constraint article_images_order_nonnegative check (display_order >= 0),
  unique (article_id, display_order)
);

create table public.article_sources (
  article_id uuid not null references public.articles(id) on delete cascade,
  source_id uuid not null references public.sources(id) on delete restrict,
  citation_label text,
  display_order integer not null,
  primary key (article_id, source_id),
  constraint article_sources_order_nonnegative check (display_order >= 0),
  unique (article_id, display_order)
);

create table public.article_related_articles (
  article_id uuid not null references public.articles(id) on delete cascade,
  related_article_id uuid not null references public.articles(id) on delete cascade,
  relationship_label text,
  display_order integer not null,
  primary key (article_id, related_article_id),
  constraint article_related_articles_not_self check (article_id <> related_article_id),
  constraint article_related_articles_order_nonnegative check (display_order >= 0),
  unique (article_id, display_order)
);

create table public.article_related_care_guides (
  article_id uuid not null references public.articles(id) on delete cascade,
  care_guide_id uuid not null references public.care_guides(id) on delete cascade,
  relationship_label text,
  display_order integer not null,
  primary key (article_id, care_guide_id),
  constraint article_related_care_guides_order_nonnegative check (display_order >= 0),
  unique (article_id, display_order)
);

create index care_guides_status_published_idx on public.care_guides (status, published_at desc);
create index care_guides_updated_at_idx on public.care_guides (updated_at desc);
create index care_guide_sections_guide_order_idx on public.care_guide_sections (care_guide_id, display_order);
create index content_images_species_id_idx on public.content_images (species_id);
create index articles_status_published_idx on public.articles (status, published_at desc);
create index articles_updated_at_idx on public.articles (updated_at desc);
create index article_sections_article_order_idx on public.article_sections (article_id, display_order);

create or replace function public.validate_care_guide_image_species()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  guide_species_id uuid;
  image_species_id uuid;
begin
  select species_id into guide_species_id
  from public.care_guides where id = new.care_guide_id;

  select species_id into image_species_id
  from public.content_images where id = new.image_id;

  if image_species_id is null or image_species_id <> guide_species_id then
    raise exception 'Care Guide images must be uploaded content images assigned to the guide species.';
  end if;

  return new;
end;
$$;

create trigger validate_care_guide_image_species_before_write
before insert or update on public.care_guide_images
for each row execute function public.validate_care_guide_image_species();

create or replace function public.validate_care_guide_publication()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  required_sections text[] := array[
    'overview', 'natural_habitat', 'aquarium_requirements', 'water_parameters',
    'behavior_and_temperament', 'tank_mates', 'diet_and_feeding',
    'common_health_concerns', 'beginner_guidance'
  ];
  required_quick_facts text[] := array[
    'scientific_name', 'adult_size', 'lifespan', 'minimum_tank_size',
    'care_level', 'temperament', 'diet', 'social_requirements',
    'temperature_range', 'ph_range'
  ];
begin
  if new.status = 'published'
    and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    if new.title is null or new.slug is null or new.summary is null then
      raise exception 'Published Care Guides require title, slug, and summary.';
    end if;

    if not (new.quick_facts ?& required_quick_facts) then
      raise exception 'Published Care Guides require all quick facts.';
    end if;

    if exists (
      select 1 from unnest(required_sections) required(section_type)
      where not exists (
        select 1 from public.care_guide_sections section
        where section.care_guide_id = new.id
          and section.section_type = required.section_type
          and section.content <> '{}'::jsonb
      )
    ) then
      raise exception 'Published Care Guides require all required sections.';
    end if;

    if (select count(*) from public.care_guide_images where care_guide_id = new.id) < 2 then
      raise exception 'Published Care Guides require at least two uploaded species images.';
    end if;

    if (select count(*) from public.care_guide_images where care_guide_id = new.id and is_primary) <> 1 then
      raise exception 'Published Care Guides require exactly one primary image.';
    end if;

    if exists (
      select 1 from public.care_guide_images assignment
      join public.content_images image on image.id = assignment.image_id
      where assignment.care_guide_id = new.id
        and (image.alt_text is null or btrim(image.alt_text) = '')
    ) then
      raise exception 'Published Care Guide images require alt text.';
    end if;

    if not exists (select 1 from public.care_guide_sources where care_guide_id = new.id) then
      raise exception 'Published Care Guides require at least one source.';
    end if;
  end if;

  return new;
end;
$$;

create trigger validate_care_guide_publication_before_write
before insert or update of status on public.care_guides
for each row execute function public.validate_care_guide_publication();

create or replace function public.validate_article_publication()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published'
    and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    if new.title is null or new.slug is null or new.summary is null then
      raise exception 'Published articles require title, slug, and summary.';
    end if;
    if not exists (
      select 1 from public.article_sections section
      where section.article_id = new.id and section.content <> '{}'::jsonb
    ) then
      raise exception 'Published articles require at least one content section.';
    end if;
  end if;
  return new;
end;
$$;

create trigger validate_article_publication_before_write
before insert or update of status on public.articles
for each row execute function public.validate_article_publication();

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'content_images', 'care_guides', 'care_guide_sections', 'sources',
    'articles', 'article_sections', 'article_categories', 'article_tags'
  ] loop
    execute format(
      'create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      table_name,
      table_name
    );
  end loop;
end;
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'content-images',
  'content-images',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'content_images', 'care_guides', 'care_guide_sections', 'care_guide_images',
    'sources', 'care_guide_sources', 'care_guide_related_species', 'articles',
    'article_sections', 'article_categories', 'article_tags',
    'article_category_assignments', 'article_tag_assignments', 'article_images',
    'article_sources', 'article_related_articles', 'article_related_care_guides'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format(
      'create policy "Admins manage %1$s" on public.%1$I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
      table_name
    );
  end loop;
end;
$$;

create policy "Public reads published Care Guides"
on public.care_guides for select to anon, authenticated
using (status = 'published');

create policy "Public reads published Care Guide sections"
on public.care_guide_sections for select to anon, authenticated
using (exists (
  select 1 from public.care_guides guide
  where guide.id = care_guide_id and guide.status = 'published'
));

create policy "Public reads published Care Guide images"
on public.care_guide_images for select to anon, authenticated
using (exists (
  select 1 from public.care_guides guide
  where guide.id = care_guide_id and guide.status = 'published'
));

create policy "Public reads published Care Guide sources"
on public.care_guide_sources for select to anon, authenticated
using (exists (
  select 1 from public.care_guides guide
  where guide.id = care_guide_id and guide.status = 'published'
));

create policy "Public reads published Care Guide related species"
on public.care_guide_related_species for select to anon, authenticated
using (exists (
  select 1 from public.care_guides guide
  where guide.id = care_guide_id and guide.status = 'published'
));

create policy "Public reads published articles"
on public.articles for select to anon, authenticated
using (status = 'published');

create policy "Public reads published article sections"
on public.article_sections for select to anon, authenticated
using (exists (
  select 1 from public.articles article
  where article.id = article_id and article.status = 'published'
));

create policy "Public reads active article categories"
on public.article_categories for select to anon, authenticated using (is_active);

create policy "Public reads active article tags"
on public.article_tags for select to anon, authenticated using (is_active);

create policy "Public reads published article category assignments"
on public.article_category_assignments for select to anon, authenticated
using (exists (
  select 1 from public.articles article
  where article.id = article_id and article.status = 'published'
));

create policy "Public reads published article tag assignments"
on public.article_tag_assignments for select to anon, authenticated
using (exists (
  select 1 from public.articles article
  where article.id = article_id and article.status = 'published'
));

create policy "Public reads published article images"
on public.article_images for select to anon, authenticated
using (exists (
  select 1 from public.articles article
  where article.id = article_id and article.status = 'published'
));

create policy "Public reads published article sources"
on public.article_sources for select to anon, authenticated
using (exists (
  select 1 from public.articles article
  where article.id = article_id and article.status = 'published'
));

create policy "Public reads published related articles"
on public.article_related_articles for select to anon, authenticated
using (exists (
  select 1 from public.articles article
  where article.id = article_id and article.status = 'published'
));

create policy "Public reads published related Care Guides"
on public.article_related_care_guides for select to anon, authenticated
using (exists (
  select 1 from public.articles article
  where article.id = article_id and article.status = 'published'
));

create policy "Public reads metadata for published content images"
on public.content_images for select to anon, authenticated
using (
  exists (
    select 1 from public.care_guide_images assignment
    join public.care_guides guide on guide.id = assignment.care_guide_id
    where assignment.image_id = content_images.id and guide.status = 'published'
  )
  or exists (
    select 1 from public.articles article
    where article.status = 'published'
      and (article.featured_image_id = content_images.id or article.open_graph_image_id = content_images.id)
  )
  or exists (
    select 1 from public.article_images assignment
    join public.articles article on article.id = assignment.article_id
    where assignment.image_id = content_images.id and article.status = 'published'
  )
);

create policy "Public reads sources attached to published content"
on public.sources for select to anon, authenticated
using (
  exists (
    select 1 from public.care_guide_sources assignment
    join public.care_guides guide on guide.id = assignment.care_guide_id
    where assignment.source_id = sources.id and guide.status = 'published'
  )
  or exists (
    select 1 from public.article_sources assignment
    join public.articles article on article.id = assignment.article_id
    where assignment.source_id = sources.id and article.status = 'published'
  )
);

create policy "Admins manage content image objects"
on storage.objects for all to authenticated
using (bucket_id = 'content-images' and public.is_admin())
with check (bucket_id = 'content-images' and public.is_admin());

create policy "Public reads published content image objects"
on storage.objects for select to anon, authenticated
using (
  bucket_id = 'content-images'
  and exists (
    select 1 from public.content_images image
    where image.storage_path = name
  )
);

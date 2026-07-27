-- Milestone 7, Issue 3: Programmatic Guide domain foundation.
-- Guides reuse the Article publishing entity and its sections, taxonomy, assets,
-- sources, and relationships. Programmatic metadata remains admin-only.

alter table public.articles
  add column content_type text not null default 'article';

alter table public.articles
  add constraint articles_content_type_allowed
  check (content_type in ('article', 'guide'));

create index articles_content_type_status_published_idx
  on public.articles (content_type, status, published_at desc);

create table public.programmatic_guide_metadata (
  article_id uuid primary key references public.articles(id) on delete cascade,
  guide_family text not null,
  guide_type text not null,
  programmatic_origin text not null default 'structured_data',
  generation_key text not null,
  generation_metadata jsonb not null default '{}'::jsonb,
  primary_search_intent text not null,
  normalized_search_intent text not null,
  search_intent_conflict_status text not null default 'none',
  source_data_fingerprint text,
  source_data_version text,
  source_data_modified_at timestamptz,
  generated_at timestamptz not null default now(),
  last_regenerated_at timestamptz,
  last_regeneration_check_at timestamptz,
  regeneration_status text not null default 'current',
  requires_regeneration boolean not null default false,
  regeneration_reason text,
  generated_content_hash text,
  current_content_hash text,
  manual_edit_protection boolean not null default true,
  manual_edits_detected boolean not null default false,
  pending_generation jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint programmatic_guide_family_not_blank check (btrim(guide_family) <> ''),
  constraint programmatic_guide_type_not_blank check (btrim(guide_type) <> ''),
  constraint programmatic_guide_origin_not_blank check (btrim(programmatic_origin) <> ''),
  constraint programmatic_guide_generation_key_normalized
    check (generation_key ~ '^[a-z0-9]+:[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint programmatic_guide_primary_intent_not_blank
    check (btrim(primary_search_intent) <> ''),
  constraint programmatic_guide_normalized_intent_valid
    check (
      normalized_search_intent = lower(btrim(normalized_search_intent))
      and normalized_search_intent !~ '\s{2,}'
      and btrim(normalized_search_intent) <> ''
    ),
  constraint programmatic_guide_conflict_status_allowed
    check (search_intent_conflict_status in ('none', 'potential', 'exact', 'resolved')),
  constraint programmatic_guide_regeneration_status_allowed
    check (regeneration_status in ('current', 'review_required', 'proposal_ready', 'blocked')),
  constraint programmatic_guide_reason_consistent
    check (requires_regeneration or regeneration_reason is null)
);

create unique index programmatic_guide_generation_key_unique_idx
  on public.programmatic_guide_metadata (generation_key);

create unique index programmatic_guide_search_intent_unique_idx
  on public.programmatic_guide_metadata (normalized_search_intent);

create index programmatic_guide_regeneration_queue_idx
  on public.programmatic_guide_metadata (requires_regeneration, last_regeneration_check_at)
  where requires_regeneration;

create table public.programmatic_guide_source_entities (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.programmatic_guide_metadata(article_id) on delete cascade,
  entity_type text not null,
  entity_key text not null,
  contribution_role text not null default 'source',
  source_version text,
  source_updated_at timestamptz,
  source_fingerprint text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint programmatic_guide_source_entity_type_not_blank
    check (btrim(entity_type) <> ''),
  constraint programmatic_guide_source_entity_key_not_blank
    check (btrim(entity_key) <> ''),
  constraint programmatic_guide_source_role_not_blank
    check (btrim(contribution_role) <> ''),
  unique (article_id, entity_type, entity_key)
);

create index programmatic_guide_source_lookup_idx
  on public.programmatic_guide_source_entities (entity_type, entity_key);

create or replace function public.require_guide_article()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  target_content_type text;
begin
  select content_type into target_content_type
  from public.articles
  where id = new.article_id;

  if target_content_type is distinct from 'guide' then
    raise exception 'Programmatic Guide metadata must belong to an Article record with content_type guide.';
  end if;

  return new;
end;
$$;

create trigger require_guide_article_before_write
before insert or update of article_id on public.programmatic_guide_metadata
for each row execute function public.require_guide_article();

create or replace function public.prevent_article_content_type_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.content_type is distinct from new.content_type then
    raise exception 'Article content type cannot be changed after creation.';
  end if;
  return new;
end;
$$;

create trigger prevent_article_content_type_change_before_update
before update of content_type on public.articles
for each row execute function public.prevent_article_content_type_change();

create trigger set_programmatic_guide_metadata_updated_at
before update on public.programmatic_guide_metadata
for each row execute function public.set_updated_at();

create trigger set_programmatic_guide_source_entities_updated_at
before update on public.programmatic_guide_source_entities
for each row execute function public.set_updated_at();

alter table public.programmatic_guide_metadata enable row level security;
alter table public.programmatic_guide_source_entities enable row level security;

create policy "Admins manage programmatic Guide metadata"
on public.programmatic_guide_metadata for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins manage programmatic Guide source entities"
on public.programmatic_guide_source_entities for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create or replace function public.create_programmatic_guide_draft(
  draft_title text,
  draft_guide_family text,
  draft_guide_type text,
  draft_generation_key text,
  draft_primary_search_intent text,
  draft_normalized_search_intent text,
  draft_generation_metadata jsonb default '{}'::jsonb,
  draft_programmatic_origin text default 'structured_data',
  draft_source_data_fingerprint text default null,
  draft_source_data_version text default null,
  draft_source_data_modified_at timestamptz default null,
  draft_generated_content_hash text default null,
  draft_current_content_hash text default null
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  created_article_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Only administrators can create Programmatic Guide drafts.';
  end if;

  insert into public.articles (title, content_type, status)
  values (draft_title, 'guide', 'draft')
  returning id into created_article_id;

  insert into public.programmatic_guide_metadata (
    article_id,
    guide_family,
    guide_type,
    programmatic_origin,
    generation_key,
    generation_metadata,
    primary_search_intent,
    normalized_search_intent,
    source_data_fingerprint,
    source_data_version,
    source_data_modified_at,
    generated_content_hash,
    current_content_hash
  )
  values (
    created_article_id,
    draft_guide_family,
    draft_guide_type,
    draft_programmatic_origin,
    draft_generation_key,
    draft_generation_metadata,
    draft_primary_search_intent,
    draft_normalized_search_intent,
    draft_source_data_fingerprint,
    draft_source_data_version,
    draft_source_data_modified_at,
    draft_generated_content_hash,
    draft_current_content_hash
  );

  return created_article_id;
end;
$$;

revoke all on function public.create_programmatic_guide_draft(
  text, text, text, text, text, text, jsonb, text, text, text, timestamptz, text, text
) from public;

grant execute on function public.create_programmatic_guide_draft(
  text, text, text, text, text, text, jsonb, text, text, text, timestamptz, text, text
) to authenticated;

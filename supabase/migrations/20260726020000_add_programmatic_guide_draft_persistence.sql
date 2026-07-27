-- Milestone 7, Issue 3: atomic persistence for deterministic Guide drafts.

create or replace function public.save_programmatic_guide_draft(
  target_article_id uuid,
  draft_title text,
  draft_slug text,
  draft_summary text,
  draft_seo_title text,
  draft_meta_description text,
  draft_primary_search_intent text,
  draft_normalized_search_intent text,
  draft_sections jsonb,
  draft_generation_metadata jsonb,
  draft_source_entities jsonb,
  draft_source_data_fingerprint text,
  draft_source_data_version text,
  draft_source_data_modified_at timestamptz,
  draft_generated_content_hash text
)
returns void
language plpgsql
set search_path = ''
as $$
declare
  target_status text;
  target_content_type text;
begin
  if not public.is_admin() then
    raise exception 'Only administrators can save Programmatic Guide drafts.';
  end if;

  select status, content_type
  into target_status, target_content_type
  from public.articles
  where id = target_article_id
  for update;

  if target_content_type is distinct from 'guide' then
    raise exception 'Programmatic Guide draft not found.';
  end if;

  if target_status is distinct from 'draft' then
    raise exception 'Only Draft Guides can be regenerated in place.';
  end if;

  update public.articles
  set
    title = draft_title,
    slug = draft_slug,
    summary = draft_summary,
    seo_title = draft_seo_title,
    meta_description = draft_meta_description
  where id = target_article_id;

  delete from public.article_sections
  where article_id = target_article_id;

  insert into public.article_sections (
    article_id,
    block_type,
    content,
    display_order
  )
  select
    target_article_id,
    section.block_type,
    section.content,
    section.display_order
  from jsonb_to_recordset(coalesce(draft_sections, '[]'::jsonb))
    as section(block_type text, content jsonb, display_order integer);

  delete from public.programmatic_guide_source_entities
  where article_id = target_article_id;

  insert into public.programmatic_guide_source_entities (
    article_id,
    entity_type,
    entity_key,
    contribution_role,
    source_version,
    source_updated_at,
    source_fingerprint
  )
  select
    target_article_id,
    source.entity_type,
    source.entity_key,
    coalesce(source.contribution_role, 'source'),
    source.source_version,
    source.source_updated_at,
    source.source_fingerprint
  from jsonb_to_recordset(coalesce(draft_source_entities, '[]'::jsonb))
    as source(
      entity_type text,
      entity_key text,
      contribution_role text,
      source_version text,
      source_updated_at timestamptz,
      source_fingerprint text
    );

  update public.programmatic_guide_metadata
  set
    generation_metadata = draft_generation_metadata,
    primary_search_intent = draft_primary_search_intent,
    normalized_search_intent = draft_normalized_search_intent,
    source_data_fingerprint = draft_source_data_fingerprint,
    source_data_version = draft_source_data_version,
    source_data_modified_at = draft_source_data_modified_at,
    last_regenerated_at = case
      when generated_content_hash is null then last_regenerated_at
      else now()
    end,
    generated_content_hash = draft_generated_content_hash,
    current_content_hash = draft_generated_content_hash,
    regeneration_status = 'current',
    requires_regeneration = false,
    regeneration_reason = null,
    manual_edits_detected = false,
    pending_generation = null
  where article_id = target_article_id;
end;
$$;

revoke all on function public.save_programmatic_guide_draft(
  uuid, text, text, text, text, text, text, text, jsonb, jsonb, jsonb, text, text,
  timestamptz, text
) from public;

grant execute on function public.save_programmatic_guide_draft(
  uuid, text, text, text, text, text, text, text, jsonb, jsonb, jsonb, text, text,
  timestamptz, text
) to authenticated;

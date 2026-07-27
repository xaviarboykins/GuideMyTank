-- Milestone 7, Issue 3: explicitly confirmed, atomic Guide regeneration.
-- Published Guides must first leave Published and are never republished here.

create or replace function public.apply_programmatic_guide_regeneration(
  target_article_id uuid,
  expected_proposal_hash text,
  confirm_published_to_draft boolean default false
)
returns void
language plpgsql
set search_path = ''
as $$
declare
  target_status text;
  target_content_type text;
  proposal jsonb;
  proposal_draft jsonb;
begin
  if not public.is_admin() then
    raise exception 'Only administrators can apply Programmatic Guide regeneration proposals.';
  end if;

  select article.status, article.content_type, metadata.pending_generation
  into target_status, target_content_type, proposal
  from public.articles as article
  join public.programmatic_guide_metadata as metadata
    on metadata.article_id = article.id
  where article.id = target_article_id
  for update of article, metadata;

  if target_content_type is distinct from 'guide' then
    raise exception 'Programmatic Guide not found.';
  end if;

  if target_status = 'archived' then
    raise exception 'Archived Guides cannot be regenerated or restored automatically.';
  end if;

  if proposal is null or proposal->>'proposalHash' is distinct from expected_proposal_hash then
    raise exception 'The regeneration proposal is missing or has changed. Review the latest proposal.';
  end if;

  if target_status = 'published' and not confirm_published_to_draft then
    raise exception 'Explicit confirmation is required to move a Published Guide back to Draft.';
  end if;

  if target_status = 'published' then
    update public.articles
    set status = 'archived'
    where id = target_article_id;

    update public.articles
    set status = 'draft', published_at = null
    where id = target_article_id;
  elsif target_status is distinct from 'draft' then
    raise exception 'Only Draft or explicitly confirmed Published Guides can apply a proposal.';
  end if;

  proposal_draft := proposal->'draft';

  perform public.save_programmatic_guide_draft(
    target_article_id,
    proposal_draft->>'title',
    proposal_draft->>'slug',
    proposal_draft->>'summary',
    proposal_draft->>'seoTitle',
    proposal_draft->>'metaDescription',
    proposal_draft->>'primarySearchIntent',
    proposal_draft->>'normalizedSearchIntent',
    (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'block_type', section.value->>'blockType',
            'content', section.value->'content',
            'display_order', section.ordinality - 1
          )
          order by section.ordinality
        ),
        '[]'::jsonb
      )
      from jsonb_array_elements(coalesce(proposal_draft->'sections', '[]'::jsonb))
        with ordinality as section(value, ordinality)
    ),
    coalesce(proposal_draft->'generationMetadata', '{}'::jsonb),
    (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'entity_type', source.value->>'entityType',
            'entity_key', source.value->>'entityKey',
            'contribution_role', coalesce(source.value->>'contributionRole', 'source'),
            'source_version', source.value->>'sourceVersion',
            'source_updated_at', source.value->>'sourceUpdatedAt',
            'source_fingerprint', source.value->>'sourceFingerprint'
          )
          order by source.ordinality
        ),
        '[]'::jsonb
      )
      from jsonb_array_elements(coalesce(proposal_draft->'sourceEntities', '[]'::jsonb))
        with ordinality as source(value, ordinality)
    ),
    proposal_draft->>'sourceDataFingerprint',
    proposal_draft->>'sourceDataVersion',
    nullif(proposal_draft->>'sourceDataModifiedAt', '')::timestamptz,
    proposal_draft->>'generatedContentHash'
  );
end;
$$;

revoke all on function public.apply_programmatic_guide_regeneration(
  uuid, text, boolean
) from public;

grant execute on function public.apply_programmatic_guide_regeneration(
  uuid, text, boolean
) to authenticated;

-- Milestone 7, Issue 5: expose only validated internal-link suggestions for
-- Published Programmatic Guides. The rest of the generation record remains
-- admin-only.

create or replace function public.get_published_programmatic_guide_links(
  target_article_id uuid
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    metadata.generation_metadata->'internalLinks',
    '[]'::jsonb
  )
  from public.programmatic_guide_metadata as metadata
  join public.articles as article
    on article.id = metadata.article_id
  where metadata.article_id = target_article_id
    and article.content_type = 'guide'
    and article.status = 'published';
$$;

revoke all on function public.get_published_programmatic_guide_links(uuid)
from public;

grant execute on function public.get_published_programmatic_guide_links(uuid)
to anon, authenticated;

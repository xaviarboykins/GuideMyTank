create or replace function public.prevent_published_article_image_metadata_edit()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  dimension_backfill_only boolean;
begin
  dimension_backfill_only :=
    (to_jsonb(new) - 'width' - 'height' - 'updated_at')
      = (to_jsonb(old) - 'width' - 'height' - 'updated_at')
    and (new.width = old.width or (old.width is null and new.width > 0))
    and (new.height = old.height or (old.height is null and new.height > 0))
    and (new.width is distinct from old.width or new.height is distinct from old.height);

  if dimension_backfill_only then
    return new;
  end if;

  if exists (
    select 1
    from public.article_images assignment
    join public.articles article on article.id = assignment.article_id
    where assignment.image_id = old.id and article.status = 'published'
  ) or exists (
    select 1 from public.articles article
    where (article.featured_image_id = old.id or article.open_graph_image_id = old.id)
      and article.status = 'published'
  ) then
    raise exception 'Archive the published article before editing its image metadata.';
  end if;

  return new;
end;
$$;

comment on function public.prevent_published_article_image_metadata_edit() is
  'Protects published article image metadata while allowing missing intrinsic dimensions to be backfilled.';

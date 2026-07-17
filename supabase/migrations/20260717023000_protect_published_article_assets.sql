create or replace function public.prevent_published_article_image_metadata_edit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
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

create trigger prevent_published_article_image_metadata_edit
before update on public.content_images
for each row execute function public.prevent_published_article_image_metadata_edit();

create or replace function public.prevent_published_article_source_metadata_edit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.article_sources assignment
    join public.articles article on article.id = assignment.article_id
    where assignment.source_id = old.id and article.status = 'published'
  ) then
    raise exception 'Archive the published article before editing its source metadata.';
  end if;
  return new;
end;
$$;

create trigger prevent_published_article_source_metadata_edit
before update on public.sources
for each row execute function public.prevent_published_article_source_metadata_edit();

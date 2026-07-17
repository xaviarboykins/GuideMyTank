create or replace function public.require_editable_article()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  target_article_id uuid;
  target_status text;
begin
  target_article_id := case when tg_op = 'DELETE' then old.article_id else new.article_id end;
  select status into target_status from public.articles where id = target_article_id;
  if target_status = 'published' then
    raise exception 'Archive the published article before editing its content or relationships.';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'article_sections', 'article_category_assignments', 'article_tag_assignments',
    'article_images', 'article_sources', 'article_related_articles',
    'article_related_care_guides'
  ] loop
    execute format(
      'create trigger require_editable_article_before_%1$I before insert or update or delete on public.%1$I for each row execute function public.require_editable_article()',
      table_name
    );
  end loop;
end;
$$;

create or replace function public.prevent_published_article_edit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = 'published' and new.status = 'published' then
    raise exception 'Archive the published article before editing it.';
  end if;
  return new;
end;
$$;

create trigger prevent_published_article_edit_before_update
before update on public.articles
for each row execute function public.prevent_published_article_edit();

create or replace function public.restrict_article_deletion()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status <> 'draft' then
    raise exception 'Only draft articles can be deleted. Archive published content instead.';
  end if;
  return old;
end;
$$;

create trigger restrict_article_deletion_before_delete
before delete on public.articles
for each row execute function public.restrict_article_deletion();

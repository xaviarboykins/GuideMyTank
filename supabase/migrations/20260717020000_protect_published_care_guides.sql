create or replace function public.require_editable_care_guide()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  target_care_guide_id uuid;
  target_status text;
begin
  target_care_guide_id := case when tg_op = 'DELETE' then old.care_guide_id else new.care_guide_id end;
  select status into target_status from public.care_guides where id = target_care_guide_id;

  if target_status = 'published' then
    raise exception 'Archive the published Care Guide before editing its content or relationships.';
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'care_guide_sections', 'care_guide_images', 'care_guide_sources',
    'care_guide_related_species'
  ] loop
    execute format(
      'create trigger require_editable_care_guide_before_%1$I before insert or update or delete on public.%1$I for each row execute function public.require_editable_care_guide()',
      table_name
    );
  end loop;
end;
$$;

create or replace function public.prevent_published_care_guide_edit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = 'published' and new.status = 'published' then
    raise exception 'Archive the published Care Guide before editing it.';
  end if;
  return new;
end;
$$;

create trigger prevent_published_care_guide_edit_before_update
before update on public.care_guides
for each row execute function public.prevent_published_care_guide_edit();

create or replace function public.prevent_published_care_guide_asset_edit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.care_guide_images assignment
    join public.care_guides guide on guide.id = assignment.care_guide_id
    where assignment.image_id = old.id and guide.status = 'published'
  ) then
    raise exception 'Archive the published Care Guide before editing its image metadata.';
  end if;
  return new;
end;
$$;

create trigger prevent_published_care_guide_image_metadata_edit
before update on public.content_images
for each row execute function public.prevent_published_care_guide_asset_edit();

create or replace function public.prevent_published_care_guide_source_edit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.care_guide_sources assignment
    join public.care_guides guide on guide.id = assignment.care_guide_id
    where assignment.source_id = old.id and guide.status = 'published'
  ) then
    raise exception 'Archive the published Care Guide before editing its source metadata.';
  end if;
  return new;
end;
$$;

create trigger prevent_published_care_guide_source_metadata_edit
before update on public.sources
for each row execute function public.prevent_published_care_guide_source_edit();

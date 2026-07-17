create or replace function public.restrict_care_guide_deletion()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status <> 'draft' then
    raise exception 'Only draft Care Guides can be deleted. Archive published content instead.';
  end if;
  return old;
end;
$$;

create trigger restrict_care_guide_deletion_before_delete
before delete on public.care_guides
for each row execute function public.restrict_care_guide_deletion();

-- Remove a drafting-style aside from the published Bristlenose summary. The
-- underlying identification guidance belongs in the full guide, but this
-- first-person editorial note reads like an instruction when surfaced on the
-- homepage and other cards.

update public.care_guides
set status = 'archived'
where slug = 'bristlenose-pleco'
  and status = 'published'
  and summary ~* 'One thing I would not do in this guide';

update public.care_guides
set summary = regexp_replace(
  summary,
  E'\\s*One thing I would not do in this guide.*$',
  '',
  'i'
)
where slug = 'bristlenose-pleco'
  and summary ~* 'One thing I would not do in this guide';

update public.care_guides
set status = 'published'
where slug = 'bristlenose-pleco'
  and status = 'archived';

-- Fail the migration if the public summary still contains the drafting phrase.
do $$
begin
  if exists (
    select 1
    from public.care_guides
    where slug = 'bristlenose-pleco'
      and summary ~* 'One thing I would not do in this guide'
  ) then
    raise exception 'Bristlenose summary drafting artifact was not removed';
  end if;
end
$$;

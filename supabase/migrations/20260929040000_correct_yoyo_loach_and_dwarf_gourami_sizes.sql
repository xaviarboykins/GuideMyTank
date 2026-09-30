update public.species
set
  max_size_inches = 6.1,
  updated_at = now()
where slug = 'yoyo-loach'
  and max_size_inches is distinct from 6.1;

update public.species
set
  max_size_inches = 3.75,
  updated_at = now()
where slug = 'dwarf-gourami'
  and max_size_inches is distinct from 3.75;

update public.species
set
  max_size_inches = 5.1,
  updated_at = now()
where slug = 'scissortail-rasbora'
  and max_size_inches is distinct from 5.1;

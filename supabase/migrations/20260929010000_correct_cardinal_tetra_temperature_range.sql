update public.species
set
  max_temp_f = 84,
  recommended_max_temp_f = 84,
  updated_at = now()
where slug = 'cardinal-tetra';

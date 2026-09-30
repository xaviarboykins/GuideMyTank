update public.species
set
  tolerated_max_temp_f = 84,
  updated_at = now()
where slug = 'cardinal-tetra';

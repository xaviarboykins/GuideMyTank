-- Species rows are the canonical source for temperature, pH, GH, and KH data.
-- Keeping a second one-to-one copy allowed the two sources to drift.
drop table if exists public.water_parameters;

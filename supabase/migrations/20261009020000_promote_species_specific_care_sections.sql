-- Preserve existing editorial copy while promoting one genuinely distinctive
-- topic per published guide into the species-specific chapter.

alter table public.care_guide_sections
drop constraint care_guide_sections_type_allowed;

alter table public.care_guide_sections
add constraint care_guide_sections_type_allowed check (
  section_type in (
    'overview', 'natural_habitat', 'adult_size_and_lifespan',
    'aquarium_requirements', 'water_parameters', 'filtration_and_flow',
    'heating_requirements', 'lighting', 'substrate', 'plants_and_decor',
    'behavior_and_temperament', 'social_requirements', 'tank_mates',
    'species_to_avoid', 'diet_and_feeding', 'common_health_concerns',
    'breeding', 'beginner_guidance', 'frequently_asked_questions'
  )
  or section_type ~ '^custom_[a-z0-9]+(_[a-z0-9]+)*$'
);

update public.care_guides
set status = 'archived'
where status = 'published'
  and slug in (
    'amano-shrimp',
    'betta-splendens',
    'bristlenose-pleco',
    'celestial-pearl-danio',
    'guppy'
  );

update public.care_guide_sections section
set
  section_type = promoted.new_section_type,
  heading = promoted.new_heading
from public.care_guides guide
join (values
  ('betta-splendens', 'filtration_and_flow', 'custom_gentle_flow_for_long_fins', 'Gentle flow for long fins'),
  ('bristlenose-pleco', 'plants_and_decor', 'custom_driftwood_and_cave_requirements', 'Driftwood and cave requirements'),
  ('guppy', 'breeding', 'custom_population_and_fry_planning', 'Population and fry planning'),
  ('celestial-pearl-danio', 'social_requirements', 'custom_group_size_and_shyness', 'Group size and shyness'),
  ('amano-shrimp', 'breeding', 'custom_brackish_larval_development', 'Brackish larval development')
) as promoted(guide_slug, old_section_type, new_section_type, new_heading)
  on promoted.guide_slug = guide.slug
where section.care_guide_id = guide.id
  and section.section_type = promoted.old_section_type;

update public.care_guides
set status = 'published'
where status = 'archived'
  and slug in (
    'amano-shrimp',
    'betta-splendens',
    'bristlenose-pleco',
    'celestial-pearl-danio',
    'guppy'
  );

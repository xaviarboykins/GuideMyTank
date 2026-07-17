insert into public.plants (
  slug,
  common_name,
  scientific_name,
  description,
  care_level,
  growth_rate,
  placement,
  minimum_light_level,
  maximum_light_level,
  co2_required,
  is_active
)
values
  (
    'java-fern',
    'Java Fern',
    'Microsorum pteropus',
    'A slow-growing, beginner-friendly rhizome plant commonly attached to wood or rock. The issue-requested aquarium-trade name Microsorum pteropus is retained; current botanical references may classify it as Leptochilus pteropus.',
    'beginner',
    'slow',
    'epiphyte',
    'low',
    'medium',
    false,
    true
  ),
  (
    'anubias-nana',
    'Anubias Nana',
    'Anubias barteri var. nana',
    'A slow-growing, beginner-friendly rhizome plant suited to shaded foreground or midground hardscape. Its rhizome should remain above the substrate.',
    'beginner',
    'slow',
    'epiphyte',
    'low',
    'medium',
    false,
    true
  ),
  (
    'amazon-sword',
    'Amazon Sword',
    'Aquarius grisebachii',
    'A beginner-friendly rosette plant generally used in the background. It is widely sold under the synonyms Echinodorus grisebachii and Echinodorus amazonicus.',
    'beginner',
    'moderate',
    'background',
    'medium',
    'medium',
    false,
    true
  ),
  (
    'vallisneria',
    'Vallisneria',
    'Vallisneria spiralis',
    'A beginner-friendly, spreading rosette plant generally used as a grassy background plant. Care values are generalized for the catalog species rather than a named cultivar.',
    'beginner',
    'fast',
    'background',
    'low',
    'medium',
    false,
    true
  ),
  (
    'dwarf-hairgrass',
    'Dwarf Hairgrass',
    'Eleocharis acicularis',
    'A carpeting foreground plant with moderate-to-high light needs. Supplemental carbon dioxide can improve compact growth but is not represented as an absolute requirement.',
    'intermediate',
    'moderate',
    'foreground',
    'medium',
    'high',
    false,
    true
  )
on conflict (slug) do update
set
  common_name = excluded.common_name,
  scientific_name = excluded.scientific_name,
  description = excluded.description,
  care_level = excluded.care_level,
  growth_rate = excluded.growth_rate,
  placement = excluded.placement,
  minimum_light_level = excluded.minimum_light_level,
  maximum_light_level = excluded.maximum_light_level,
  co2_required = excluded.co2_required,
  is_active = excluded.is_active,
  updated_at = now();

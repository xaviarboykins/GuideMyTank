-- Repair published editorial relationships and convert legacy Care Guide FAQs
-- to the same structured question/answer shape used by articles.

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
set content = case guide.slug
  when 'betta-splendens' then jsonb_build_object('items', jsonb_build_array(
    jsonb_build_object('question', 'Can a betta live in a bowl?', 'answer', 'A bowl usually lacks the stable heat, filtration, swimming space, and enrichment needed for good welfare. Use a heated, filtered aquarium instead.'),
    jsonb_build_object('question', 'Does a betta need a heater?', 'answer', 'Usually yes; stability within the tropical range matters even when daytime room temperature seems warm.'),
    jsonb_build_object('question', 'Does a betta need a companion?', 'answer', 'No. A betta can thrive alone, and another betta may create severe aggression.'),
    jsonb_build_object('question', 'Why does a betta gulp air?', 'answer', 'Bettas possess a labyrinth organ and normally breathe at the surface, but unusually frequent or distressed breathing still warrants water-quality and health checks.')
  ))
  when 'bristlenose-pleco' then jsonb_build_object('items', jsonb_build_array(
    jsonb_build_object('question', 'Does a Bristlenose Pleco need driftwood?', 'answer', 'Yes. Natural driftwood should be considered an essential part of a Bristlenose Pleco aquarium. It provides shelter, grazing surfaces, and supports their natural behavior.'),
    jsonb_build_object('question', 'Do Bristlenose Plecos eat all the algae in a tank?', 'answer', 'No. They are excellent algae grazers, but they will not eliminate every type of algae and still require regular feeding with algae wafers, sinking foods, and vegetables.'),
    jsonb_build_object('question', 'Can I keep more than one Bristlenose Pleco?', 'answer', 'Yes, provided the aquarium is large enough and has sufficient bottom territory. Give each pleco its own cave and hiding areas, particularly when keeping multiple males.'),
    jsonb_build_object('question', 'How big do Bristlenose Plecos get?', 'answer', 'Most Common Bristlenose Plecos reach around 4 to 6 inches, making them significantly smaller and more manageable than Common Plecos.')
  ))
  when 'guppy' then jsonb_build_object('items', jsonb_build_array(
    jsonb_build_object('question', 'Are guppies good for beginners?', 'answer', 'Yes. Guppies are hardy, adaptable, and easy to care for, making them a great choice for new aquarium keepers.'),
    jsonb_build_object('question', 'How many guppies should be kept together?', 'answer', 'Keep at least 3–5 guppies. For mixed-sex groups, aim for 2–3 females per male to reduce stress from persistent mating behavior.'),
    jsonb_build_object('question', 'How often do guppies have babies?', 'answer', 'Female guppies can produce a brood roughly every 3–4 weeks and may store sperm, allowing them to produce multiple broods after mating.')
  ))
  when 'celestial-pearl-danio' then jsonb_build_object('items', jsonb_build_array(
    jsonb_build_object('question', 'How many Celestial Pearl Danios should be kept together?', 'answer', 'Keep at least 8 individuals, although a group of 10 or more can help them feel more secure and encourage natural social behavior.'),
    jsonb_build_object('question', 'Do Celestial Pearl Danios need a heater?', 'answer', 'Not always. They prefer 72–76°F (22–24°C), so a heater may not be necessary if your aquarium naturally remains within this range.'),
    jsonb_build_object('question', 'Can Celestial Pearl Danios live with shrimp?', 'answer', 'Yes. They generally coexist well with adult peaceful shrimp, although they may eat newly hatched shrimplets if they can catch them.'),
    jsonb_build_object('question', 'Why are my Celestial Pearl Danios hiding?', 'answer', 'Hiding is often caused by small group size, insufficient plant cover, overly active tank mates, or stress. Keeping a larger group in a densely planted aquarium usually helps them become more confident.')
  ))
  when 'amano-shrimp' then jsonb_build_object('items', jsonb_build_array(
    jsonb_build_object('question', 'Do Amano shrimp eat algae?', 'answer', 'Yes. Amano shrimp are excellent algae grazers and will also consume biofilm and leftover food, though they cannot replace regular aquarium maintenance.'),
    jsonb_build_object('question', 'How many Amano shrimp should I keep?', 'answer', 'They can live alone, but a group of 3–6 or more is ideal for encouraging natural activity.'),
    jsonb_build_object('question', 'Can Amano shrimp live with fish?', 'answer', 'Yes. They do well with small, peaceful community fish. Avoid large or predatory species that could eat them.'),
    jsonb_build_object('question', 'Do Amano shrimp need a heater?', 'answer', 'Not always. If your aquarium naturally remains within their preferred 65–78°F (18–26°C) range, a heater may not be necessary.'),
    jsonb_build_object('question', 'Why is my Amano shrimp hiding?', 'answer', 'Hiding is common after molting, when the shrimp''s new exoskeleton is soft. New shrimp may also hide while adjusting to the aquarium.'),
    jsonb_build_object('question', 'Can Amano shrimp breed in freshwater?', 'answer', 'Adults breed in freshwater, but their larvae require a saltwater or brackish development stage, so they will not successfully reproduce entirely in a typical freshwater aquarium.'),
    jsonb_build_object('question', 'How long do Amano shrimp live?', 'answer', 'Most live around 2–3 years, although well-cared-for individuals can live considerably longer.')
  ))
  else section.content
end
from public.care_guides guide
where guide.id = section.care_guide_id
  and section.section_type = 'frequently_asked_questions'
  and guide.slug in (
    'amano-shrimp',
    'betta-splendens',
    'bristlenose-pleco',
    'celestial-pearl-danio',
    'guppy'
  );

update public.care_guides guide
set open_graph_image_id = image.image_id
from public.care_guide_images image
where image.care_guide_id = guide.id
  and image.is_primary = true
  and guide.open_graph_image_id is null;

insert into public.care_guide_related_species (
  care_guide_id,
  species_id,
  relationship_label,
  display_order
)
select guide.id, species.id, relationship.label, 0
from (values
  ('betta-splendens', 'dwarf-gourami', 'Related labyrinth-fish care research'),
  ('celestial-pearl-danio', 'chili-rasbora', 'Related planted nano-aquarium research')
) as relationship(guide_slug, species_slug, label)
join public.care_guides guide on guide.slug = relationship.guide_slug
join public.species species on species.slug = relationship.species_slug
on conflict (care_guide_id, species_id) do nothing;

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

update public.articles
set status = 'archived'
where status = 'published'
  and slug in (
    'most-popular-freshwater-aquarium-fish-2026',
    'the-best-tank-cleaning-crew-2026',
    'amano-shrimp-vs-bristlenose-pleco'
  );

insert into public.article_category_assignments (article_id, category_id)
select article.id, category.id
from public.articles article
join public.article_categories category on category.slug = 'fish-care-species'
where article.slug = 'most-popular-freshwater-aquarium-fish-2026'
on conflict (article_id, category_id) do nothing;

insert into public.article_sources (article_id, source_id, display_order)
select article.id, source.id, source_order.display_order
from (values
  ('the-best-tank-cleaning-crew-2026', 'https://www.aquariumcoop.com/blogs/aquarium/amano-shrimp', 0),
  ('the-best-tank-cleaning-crew-2026', 'https://www.ancistrus.at/en/bristlenose-catfishes-ancistrus-in-the-aquarium-keeping-care-and-breeding/', 1)
) as source_order(article_slug, source_url, display_order)
join public.articles article on article.slug = source_order.article_slug
join public.sources source on source.url = source_order.source_url
on conflict (article_id, source_id) do nothing;

insert into public.article_related_care_guides (
  article_id,
  care_guide_id,
  relationship_label,
  display_order
)
select article.id, guide.id, relationship.label, relationship.display_order
from (values
  ('most-popular-freshwater-aquarium-fish-2026', 'betta-splendens', 'Featured species care guide', 0),
  ('most-popular-freshwater-aquarium-fish-2026', 'guppy', 'Featured species care guide', 1),
  ('the-best-tank-cleaning-crew-2026', 'amano-shrimp', 'Featured cleanup species care guide', 0),
  ('the-best-tank-cleaning-crew-2026', 'bristlenose-pleco', 'Featured cleanup species care guide', 1),
  ('amano-shrimp-vs-bristlenose-pleco', 'amano-shrimp', 'Compared species care guide', 0),
  ('amano-shrimp-vs-bristlenose-pleco', 'bristlenose-pleco', 'Compared species care guide', 1)
) as relationship(article_slug, guide_slug, label, display_order)
join public.articles article on article.slug = relationship.article_slug
join public.care_guides guide on guide.slug = relationship.guide_slug
on conflict (article_id, care_guide_id) do nothing;

update public.articles
set status = 'published'
where status = 'archived'
  and slug in (
    'most-popular-freshwater-aquarium-fish-2026',
    'the-best-tank-cleaning-crew-2026',
    'amano-shrimp-vs-bristlenose-pleco'
  );

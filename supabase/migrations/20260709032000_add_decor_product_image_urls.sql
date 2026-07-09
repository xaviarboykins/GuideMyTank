update public.products as product
set
  image_url = image_sources.image_url,
  updated_at = now()
from (
  values
    (
      'hygger-small-tree-trunk-aquarium-ornament',
      'https://www.petnannystore.com/cdn/shop/products/HG-912_1_small.png?v=1629799941'
    ),
    (
      'fluval-mopani-driftwood-medium',
      'https://s7d2.scene7.com/is/image/PetSmart/5309891?fmt=webp&hei=400&wid=400'
    ),
    (
      'marineland-bamboo-aquarium-decor',
      'https://cdn11.bigcommerce.com/s-15h88fcyw7/images/stencil/1280x1280/products/10627/15762/AQU90548-2T__80270.1689949632.png?c=1'
    ),
    (
      'aqueon-betta-castle-kit-ornament',
      'https://petgeneralstore.com/cdn/shop/products/77429_medium.jpg?v=1654718758'
    ),
    (
      'penn-plax-spongebob-pineapple-house',
      'https://cdn11.bigcommerce.com/s-s4f5l4ll/images/stencil/1280x1280/products/441/2466/penn_plax_sponge_bob_pineapple_house_1_750__86257.1422124774.jpg?c=2'
    ),
    (
      'imagitarium-stacked-stone-hideaway',
      'https://assets.petco.com/petco/image/upload/c_pad%2Cdpr_1.0%2Cf_auto%2Cq_auto%2Ch_636%2Cw_636/c_pad%2Ch_636%2Cw_636/l_bypetco-badge%2Cfl_relative%2Cw_0.20%2Cg_south_east%2Ce_sharpen/3793536-center-1'
    )
) as image_sources(slug, image_url)
where product.slug = image_sources.slug;

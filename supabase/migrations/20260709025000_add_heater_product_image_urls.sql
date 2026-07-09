update public.products as product
set
  image_url = image_sources.image_url,
  updated_at = now()
from (
  values
    (
      'aqueon-pro-50w-heater',
      'https://joshsfrogs.com/media/image/aq6105a-d4a6a251.jpg?width=1200'
    ),
    (
      'aqueon-pro-100w-heater',
      'https://joshsfrogs.com/media/image/aq6105a-d4a6a251.jpg?width=1200'
    ),
    (
      'fluval-m100-submersible-heater',
      'https://m.media-amazon.com/images/I/61NiBdOzOFL._AC_SX679_.jpg'
    ),
    (
      'eheim-jager-150w-heater',
      'https://krakencorals.co.uk/media/catalog/product/cache/9fbca2f3760113f8f83948089e9f1adf/_/7/_7_8_7813_1_4_66.jpg'
    ),
    (
      'hygger-100w-submersible-aquarium-heater',
      'https://i.ebayimg.com/images/g/WZgAAOSwILVl4I~1/s-l1600.webp'
    ),
    (
      'aqueon-preset-50w-heater',
      'https://www.aqueon.com/-/media/project/oneweb/aqueon/us/products/preset-heaters/015905062510main.jpg'
    )
) as image_sources(slug, image_url)
where product.slug = image_sources.slug;

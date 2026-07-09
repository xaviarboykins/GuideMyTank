update public.products as product
set
  image_url = image_sources.image_url,
  updated_at = now()
from (
  values
    (
      'fluval-aquaclear-20-power-filter',
      'https://image.chewy.com/catalog/general/images/moe/06818ee1-e762-7a3e-8000-9915bc992360._AC_SL248_V1_.jpg'
    ),
    (
      'fluval-aquaclear-50-power-filter',
      'https://image.chewy.com/catalog/general/images/moe/06818ee1-c72e-7cf5-8000-9078a0bb981d._AC_SX500_SY400_QL75_V1_.jpg'
    ),
    (
      'fluval-aquaclear-70-power-filter',
      'https://image.chewy.com/catalog/general/images/moe/06818ee5-33cb-7de2-8000-b4c8db46ea19._AC_SL248_V1_.jpg'
    ),
    (
      'seachem-tidal-35-power-filter',
      'https://www.horizonaquatics.co.uk/cdn/shop/products/tidel55.webp?v=1752748743'
    ),
    (
      'seachem-tidal-55-power-filter',
      'https://www.horizonaquatics.co.uk/cdn/shop/products/tidel55.webp?v=1752748743'
    ),
    (
      'seachem-tidal-75-power-filter',
      'https://www.horizonaquatics.co.uk/cdn/shop/products/tidel55.webp?v=1752748743'
    ),
    (
      'marineland-penguin-200-power-filter',
      'https://image.chewy.com/catalog/general/images/marineland-bio-wheel-penguin-aquarium-power-filter-50gal/img-88642._AC_SX500_SY400_QL75_V1_.jpg'
    ),
    (
      'marineland-penguin-350-power-filter',
      'https://image.chewy.com/catalog/general/images/marineland-bio-wheel-penguin-aquarium-power-filter-50gal/img-88642._AC_SX500_SY400_QL75_V1_.jpg'
    ),
    (
      'eheim-classic-250-canister-filter',
      'https://cdn11.bigcommerce.com/s-fh5tkm/images/stencil/1280x1280/products/634/1589/250__21748.1446688831.jpg?c=2%3Fimbypass%3Don'
    ),
    (
      'aqueon-quietflow-50-led-pro-filter',
      'https://image.chewy.com/catalog/general/images/aqueon-quietflow-led-pro-aquarium-power-filter-size-75/img-87488._SL1200_QL100_V1_.jpg'
    )
) as image_sources(slug, image_url)
where product.slug = image_sources.slug;

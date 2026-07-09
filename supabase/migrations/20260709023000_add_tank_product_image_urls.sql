update public.products as product
set
  image_url = image_sources.image_url,
  updated_at = now()
from (
  values
    (
      'aqueon-standard-10-gallon-aquarium',
      'https://petswarehouse.com/cdn/shop/files/aqueon-standard-glass-rectangle-aquarium-clear-silicone-black-40-280.jpg?v=1712692226&width=1946'
    ),
    (
      'aqueon-standard-20-gallon-high-aquarium',
      'https://petswarehouse.com/cdn/shop/files/aqueon-standard-glass-rectangle-aquarium-clear-silicone-black-40-280.jpg?v=1712692226&width=1946'
    ),
    (
      'fluval-flex-15-gallon-aquarium-kit',
      'https://m.media-amazon.com/images/I/81yZ0%2B23jvL._AC_US1400_.jpg'
    ),
    (
      'marineland-portrait-5-gallon-aquarium-kit',
      'https://cdn.bigeasymart.com/wp-content/uploads/2022/06/Marineland-Portrait-Glass-LED-Aquarium-Kit-5-Gallons-Hidden-Filtration-1-510x737.jpg'
    ),
    (
      'api-aquaview-360-3-gallon-aquarium-kit',
      'https://www.inovago.com/cdn/shop/products/61-O2wtWsqL.jpg?v=1591217013&width=940'
    ),
    (
      'aqueon-standard-40-gallon-breeder-aquarium',
      'https://petswarehouse.com/cdn/shop/files/aqueon-standard-glass-rectangle-aquarium-clear-silicone-black-40-280.jpg?v=1712692226&width=1946'
    )
) as image_sources(slug, image_url)
where product.slug = image_sources.slug;

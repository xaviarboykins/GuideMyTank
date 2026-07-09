update public.products as product
set
  image_url = image_sources.image_url,
  updated_at = now()
from (
  values
    (
      'nicrew-classicled-plus-18-24',
      'https://m.media-amazon.com/images/I/61wWYHJWO6L._AC_SL1500_.jpg'
    ),
    (
      'nicrew-classicled-plus-30-36',
      'https://m.media-amazon.com/images/I/61wWYHJWO6L._AC_SL1500_.jpg'
    ),
    (
      'nicrew-skyled-plus-24-30',
      'https://m.media-amazon.com/images/I/61wWYHJWO6L._AC_SL1500_.jpg'
    ),
    (
      'hygger-957-planted-24-7-24-30',
      'https://splashyfishstore.com/cdn/shop/files/z6641644099186_fd51362ee9a794a47c6adf6cd7fc9056.jpg?v=1748264958&width=1080'
    ),
    (
      'hygger-957-planted-36-42',
      'https://splashyfishstore.com/cdn/shop/files/z6641644099186_fd51362ee9a794a47c6adf6cd7fc9056.jpg?v=1748264958&width=1080'
    ),
    (
      'fluval-plant-3-0-led-24-34',
      'https://assets.petco.com/petco/image/upload/c_pad%2Cdpr_1.0%2Cf_auto%2Cq_auto%2Ch_636%2Cw_636/c_pad%2Ch_636%2Cw_636/3012390-center-1'
    ),
    (
      'fluval-plant-3-0-led-36-46',
      'https://03.cdn37.se/mM1/images/2.79531/fluval-plant-30-led-91-122-cm-46-w.jpeg'
    ),
    (
      'aqueon-planted-aquarium-clip-on-led',
      'https://www.aquariumbeauties.com/wp-content/uploads/2025/6/1749264404/aqueon-clip-on-led-light-planted-1749264409.webp'
    ),
    (
      'aqueon-deluxe-led-full-hood-24',
      'https://www.thefishroom.net/cdn/shop/products/47_af503301-7e1c-4852-a8cd-29bdd58df3f3_1920x.jpg?v=1599078636'
    )
) as image_sources(slug, image_url)
where product.slug = image_sources.slug;

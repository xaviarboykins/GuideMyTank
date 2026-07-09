update public.products as product
set
  image_url = image_sources.image_url,
  updated_at = now()
from (
  values
    (
      'seachem-flourite-red',
      'https://www.americanaquariumproducts.com/uploads/1/4/4/7/144701674/s277506087431540636_p355_i1_w600.jpeg'
    ),
    (
      'seachem-flourite-black',
      'https://shop.morphmarket.com/cdn/shop/files/axfeabsaxgknrgz5gkjs.jpg?v=1758727733&width=2218'
    ),
    (
      'fluval-plant-and-shrimp-stratum',
      'https://www.shrimplover.ca/cdn/shop/products/85.jpg?v=1655154816&width=1445'
    ),
    (
      'aqueon-plant-and-shrimp-aquarium-substrate',
      'https://ageofaquariumsstores.com/cdn/shop/products/E404E3D4-C609-446F-8D14-04A2C12C28E5_800x.jpg?v=1620180162'
    ),
    (
      'imagitarium-black-aquarium-sand',
      'https://d2lnr5mha7bycj.cloudfront.net/product-image/file/large_7d962be3-6bfb-4a16-ad24-50d24ba3a1b1.jpg'
    ),
    (
      'caribsea-eco-complete-planted-black',
      'https://aquariumswest.com/cdn/shop/products/Eco_Planted_black_20lb_800x.jpg?v=1644694136'
    )
) as image_sources(slug, image_url)
where product.slug = image_sources.slug;

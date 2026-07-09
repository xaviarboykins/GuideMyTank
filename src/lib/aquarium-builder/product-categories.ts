export const aquariumBuilderProductCategories = [
  {
    slug: "tanks",
    heading: "Choose Tank",
    label: "Tanks",
  },
  {
    slug: "filters",
    heading: "Choose Filter",
    label: "Filters",
  },
  {
    slug: "heaters",
    heading: "Choose Heater",
    label: "Heaters",
  },
  {
    slug: "lights",
    heading: "Choose Lighting",
    label: "Lighting",
  },
  {
    slug: "substrates",
    heading: "Choose Substrate",
    label: "Substrates",
  },
  {
    slug: "decor",
    heading: "Add Decor",
    label: "Decor",
  },
] as const;

export type AquariumBuilderProductCategory =
  (typeof aquariumBuilderProductCategories)[number];

export type AquariumBuilderProductCategorySlug =
  AquariumBuilderProductCategory["slug"];

export function getAquariumBuilderProductCategory(
  slug: string,
): AquariumBuilderProductCategory | null {
  return (
    aquariumBuilderProductCategories.find((category) => {
      return category.slug === slug;
    }) ?? null
  );
}

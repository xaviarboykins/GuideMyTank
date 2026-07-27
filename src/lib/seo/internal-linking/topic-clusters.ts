import type { TopicClusterDefinition } from "./types";

export const topicClusters = [
  {
    slug: "betta-compatibility",
    title: "Betta Compatibility",
    description:
      "Research Betta splendens care, compatible tank mates, and aquarium planning.",
    hub: { entityType: "species", slug: "betta-splendens" },
    species: [
      {
        slug: "betta-splendens",
        title: "Betta Species Profile",
      },
    ],
    careGuides: [
      {
        slug: "betta-splendens",
        title: "Betta Fish Care Guide",
      },
    ],
    guides: [
      {
        slug: "betta-splendens-vs-guppy",
        title: "Betta vs Guppy",
      },
    ],
    compatibilitySpeciesSlugs: ["betta-splendens"],
    productCategories: ["tanks", "filters", "heaters"],
  },
  {
    slug: "popular-freshwater-fish",
    title: "Popular Freshwater Fish",
    description:
      "Compare ten widely recognized freshwater aquarium fish and their long-term care requirements.",
    hub: {
      entityType: "article",
      slug: "most-popular-freshwater-aquarium-fish-2026",
    },
    species: [
      { slug: "guppy", title: "Guppy Species Profile" },
      { slug: "betta-splendens", title: "Betta Species Profile" },
      { slug: "neon-tetra", title: "Neon Tetra Species Profile" },
      {
        slug: "corydoras-catfish",
        title: "Corydoras Catfish Species Profile",
      },
      { slug: "shortfin-molly", title: "Molly Species Profile" },
      { slug: "platy", title: "Platy Species Profile" },
      { slug: "zebra-danio", title: "Zebra Danio Species Profile" },
      { slug: "angelfish", title: "Angelfish Species Profile" },
      {
        slug: "bristlenose-pleco",
        title: "Bristlenose Pleco Species Profile",
      },
      {
        slug: "common-goldfish",
        title: "Common Goldfish Species Profile",
      },
    ],
    articles: [
      {
        slug: "most-popular-freshwater-aquarium-fish-2026",
        title: "Most Popular Freshwater Aquarium Fish in 2026",
      },
    ],
  },
] as const satisfies readonly TopicClusterDefinition[];

/**
 * Safe fallback revalidation windows. Public mutations should also use the
 * targeted helpers in revalidation.ts so these are not the primary freshness
 * mechanism.
 */
export const CACHE_TTL = {
  homepage: 21_600,
  navigation: 21_600,
  learningCenter: 21_600,
  species: 604_800,
  compatibility: 2_592_000,
  careGuides: 604_800,
  products: 604_800,
  sitemap: 86_400,
} as const;

export type CacheFamily = keyof typeof CACHE_TTL;

export const COMPATIBILITY_SITEMAP_BATCH_SIZE = 10_000;

export function getSitemapBatchIds(totalUrls: number, batchSize: number) {
  if (totalUrls < 1 || batchSize < 1) {
    return [];
  }

  return Array.from(
    { length: Math.ceil(totalUrls / batchSize) },
    (_, id) => ({ id }),
  );
}

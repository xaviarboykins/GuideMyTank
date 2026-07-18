import { describe, expect, it } from "vitest";

import { getSitemapBatchIds } from "./sitemaps";

describe("sitemap batching", () => {
  it("creates only the batches required for the URL count", () => {
    expect(getSitemapBatchIds(0, 10_000)).toEqual([]);
    expect(getSitemapBatchIds(4_950, 10_000)).toEqual([{ id: 0 }]);
    expect(getSitemapBatchIds(20_001, 10_000)).toEqual([
      { id: 0 },
      { id: 1 },
      { id: 2 },
    ]);
  });
});

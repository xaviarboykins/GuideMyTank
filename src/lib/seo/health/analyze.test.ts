import { describe, expect, it, vi } from "vitest";

import { analyzeSeoImages, analyzeSeoPages } from "./analyze";

vi.stubEnv("NODE_ENV", "production");
vi.stubEnv("SITE_URL", "");

describe("SEO health analysis", () => {
  it("detects metadata, canonical, link, orphan, and sitemap issues", () => {
    const issues = analyzeSeoPages([
      { path: "/", family: "static", title: "Home", description: "Home page", canonical: "https://www.guidemytank.com", indexable: true, inSitemap: true, links: ["/species", "/missing"] },
      { path: "/species", family: "species", title: "Species", description: "Directory", canonical: "https://guidemytank.com/species", indexable: true, inSitemap: true, links: [] },
      { path: "/draft", family: "article", title: null, description: null, canonical: null, indexable: false, inSitemap: true, links: [] },
    ]);

    expect(issues.map((item) => item.category)).toEqual(expect.arrayContaining(["broken_internal_link", "canonical_hostname", "nonindexable_in_sitemap"]));
  });

  it("detects incomplete image metadata", () => {
    const issues = analyzeSeoImages([{ id: "1", storagePath: "content/fish.webp", altText: null, width: null, height: 800 }]);
    expect(issues.map((item) => item.category)).toEqual(["missing_image_dimensions", "missing_image_alt"]);
  });
});

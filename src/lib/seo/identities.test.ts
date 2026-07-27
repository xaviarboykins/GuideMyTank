import { describe, expect, it } from "vitest";

import {
  getArticleId,
  getBreadcrumbId,
  getWebPageId,
  ORGANIZATION_ID,
  WEBSITE_ID,
} from "./identities";

describe("SEO entity identities", () => {
  it("uses stable global identities", () => {
    expect(ORGANIZATION_ID).toBe(
      "https://www.guidemytank.com/#organization",
    );
    expect(WEBSITE_ID).toBe("https://www.guidemytank.com/#website");
  });

  it("derives page identities from canonical URLs", () => {
    expect(getWebPageId()).toBe(
      "https://www.guidemytank.com/#webpage",
    );
    expect(getWebPageId("/species/betta")).toBe(
      "https://www.guidemytank.com/species/betta#webpage",
    );
    expect(getArticleId("/learning-center/guides/betta-tank-mates")).toBe(
      "https://www.guidemytank.com/learning-center/guides/betta-tank-mates#article",
    );
    expect(getBreadcrumbId("/species/betta")).toBe(
      "https://www.guidemytank.com/species/betta#breadcrumbs",
    );
  });
});

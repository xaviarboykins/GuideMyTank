import { describe, expect, it } from "vitest";

import {
  buildBreadcrumbEntity,
  createBreadcrumbs,
} from "./breadcrumbs";
import { getBreadcrumbId } from "./identities";
import { getSiteUrl } from "./site-url";

describe("shared breadcrumbs", () => {
  const items = [
    { name: "Home", path: "/" },
    { name: "Species", path: "/species" },
    { name: "Betta", path: "/species/betta" },
  ];

  it("normalizes one source of visible breadcrumb data", () => {
    expect(createBreadcrumbs(items)).toEqual(items);
    expect(
      createBreadcrumbs([{ name: "Missing", path: "https://example.com" }]),
    ).toBeNull();
  });

  it("converts the same data to absolute structured breadcrumbs", () => {
    expect(
      buildBreadcrumbEntity("/species/betta", items),
    ).toEqual({
      "@type": "BreadcrumbList",
      "@id": getBreadcrumbId("/species/betta"),
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: getSiteUrl(),
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Species",
          item: getSiteUrl("/species"),
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Betta",
          item: getSiteUrl("/species/betta"),
        },
      ],
    });
  });
});

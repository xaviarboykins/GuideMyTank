import { describe, expect, it } from "vitest";

import {
  getArticleId,
  getWebPageId,
  ORGANIZATION_ID,
  WEBSITE_ID,
} from "../identities";
import { getSiteUrl } from "../site-url";

import {
  buildArticle,
  buildBreadcrumbList,
  buildFaqPage,
  buildOrganization,
  buildWebPage,
  buildWebSite,
} from "./builders";

describe("schema entity builders", () => {
  it("builds the canonical Organization and WebSite", () => {
    expect(buildOrganization()).toEqual({
      "@type": "Organization",
      "@id": ORGANIZATION_ID,
      name: "GuideMyTank",
      url: getSiteUrl(),
    });
    expect(buildWebSite()).toEqual({
      "@type": "WebSite",
      "@id": WEBSITE_ID,
      name: "GuideMyTank",
      url: getSiteUrl(),
      publisher: { "@id": ORGANIZATION_ID },
    });
  });

  it("builds a WebPage and omits unavailable optional values", () => {
    expect(
      buildWebPage({
        id: getWebPageId("/species/betta"),
        name: "Betta Species Profile",
        description: "Care requirements for Betta splendens.",
        url: getSiteUrl("/species/betta"),
        aboutIds: [ORGANIZATION_ID, "", "not-a-url"],
        dateModified: "not-a-date",
      }),
    ).toEqual({
      "@type": "WebPage",
      "@id": getWebPageId("/species/betta"),
      name: "Betta Species Profile",
      description: "Care requirements for Betta splendens.",
      url: getSiteUrl("/species/betta"),
      isPartOf: { "@id": WEBSITE_ID },
      about: [{ "@id": ORGANIZATION_ID }],
    });
  });

  it("rejects a WebPage missing required content", () => {
    expect(
      buildWebPage({
        id: getWebPageId("/species/betta"),
        name: " ",
        description: "Description",
        url: getSiteUrl("/species/betta"),
      }),
    ).toBeNull();
  });

  it("builds one shared Article shape with accurate optional values", () => {
    const path = "/learning-center/guides/betta-tank-mates";
    expect(
      buildArticle({
        id: getArticleId(path),
        headline: "Best Betta Tank Mates",
        description: "A structured guide to compatible tank mates.",
        url: getSiteUrl(path),
        webPageId: getWebPageId(path),
        datePublished: "2026-07-20T12:00:00.000Z",
        dateModified: "invalid",
        keywords: ["betta", " tank mates ", "betta", ""],
      }),
    ).toEqual({
      "@type": "Article",
      "@id": getArticleId(path),
      headline: "Best Betta Tank Mates",
      description: "A structured guide to compatible tank mates.",
      url: getSiteUrl(path),
      mainEntityOfPage: { "@id": getWebPageId(path) },
      publisher: { "@id": ORGANIZATION_ID },
      datePublished: "2026-07-20T12:00:00.000Z",
      keywords: ["betta", "tank mates"],
    });
  });

  it("rejects an Article with missing required fields", () => {
    expect(
      buildArticle({
        id: getArticleId("/learning-center/example"),
        headline: null,
        description: "Description",
        url: getSiteUrl("/learning-center/example"),
        webPageId: getWebPageId("/learning-center/example"),
      }),
    ).toBeNull();
  });

  it("builds sequential breadcrumbs or rejects an invalid item", () => {
    const id = `${getWebPageId("/species/betta")}-breadcrumbs`;
    expect(
      buildBreadcrumbList({
        id,
        items: [
          { name: "Home", url: getSiteUrl() },
          { name: "Species", url: getSiteUrl("/species") },
          { name: "Betta", url: getSiteUrl("/species/betta") },
        ],
      })?.itemListElement.map((item) => item.position),
    ).toEqual([1, 2, 3]);

    expect(
      buildBreadcrumbList({
        id,
        items: [{ name: "Home", url: "/" }],
      }),
    ).toBeNull();
  });

  it("filters incomplete FAQs and removes duplicate questions", () => {
    const faq = buildFaqPage({
      id: `${getWebPageId("/learning-center/example")}-faq`,
      items: [
        { question: "Can bettas live together?", answer: "Usually not." },
        { question: " can   bettas live together? ", answer: "Duplicate." },
        { question: "What size tank?", answer: "At least five gallons." },
        { question: "Incomplete?", answer: " " },
      ],
    });

    expect(faq?.mainEntity).toHaveLength(2);
    expect(faq?.mainEntity[0].acceptedAnswer.text).toBe("Usually not.");
  });
});

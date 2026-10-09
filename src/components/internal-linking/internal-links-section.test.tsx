import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { InternalLinksSection } from "./internal-links-section";

describe("InternalLinksSection", () => {
  it("does not render an empty section", () => {
    expect(
      InternalLinksSection({
        title: "Related Content",
        items: [],
      }),
    ).toBeNull();
  });

  it("renders a compact, deduplicated resource list", () => {
    const markup = renderToStaticMarkup(
      InternalLinksSection({
        title: "Related resources",
        items: [
          {
            entityType: "article",
            entityId: "one",
            title: "First resource",
            href: "/learning-center/first",
            description: "A useful summary.\nWith extra whitespace.",
            relationship: "related-content",
          },
          {
            entityType: "article",
            entityId: "duplicate",
            title: "Duplicate resource",
            href: "/learning-center/first",
            relationship: "related-content",
          },
        ],
      }),
    );

    expect(markup.match(/href="\/learning-center\/first"/g)).toHaveLength(1);
    expect(markup).toContain("A useful summary. With extra whitespace.");
    expect(markup).not.toContain("rounded-lg");
  });
});

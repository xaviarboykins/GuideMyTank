import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { buildOrganization } from "../../lib/seo/schema/builders";

import { JsonLd } from "./json-ld";

describe("JsonLd", () => {
  it("renders one safe graph script with a predictable ID", () => {
    const organization = buildOrganization({
      name: "GuideMyTank </script> & Research",
    });
    const markup = renderToStaticMarkup(
      <JsonLd entities={organization} />,
    );

    expect(markup).toContain('id="guidemytank-json-ld"');
    expect(markup).toContain('type="application/ld+json"');
    expect(markup).toContain("\\u003c/script\\u003e");
    expect(markup).toContain("\\u0026");
    expect(markup).not.toContain("</script> & Research");
  });

  it("omits empty and conflicting graphs", () => {
    expect(renderToStaticMarkup(<JsonLd entities={null} />)).toBe("");

    const organization = buildOrganization();
    const conflicting = organization
      ? { ...organization, name: "Conflicting Name" }
      : null;

    expect(
      renderToStaticMarkup(
        <JsonLd entities={[organization, conflicting]} />,
      ),
    ).toBe("");
  });
});

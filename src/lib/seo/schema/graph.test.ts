import { describe, expect, it } from "vitest";

import { buildOrganization, buildWebSite } from "./builders";
import { composeSchemaGraph } from "./graph";

describe("schema graph composition", () => {
  it("flattens inputs, removes omitted entities, and preserves order", () => {
    const organization = buildOrganization();
    const website = buildWebSite();
    const result = composeSchemaGraph(
      null,
      [organization, false, [undefined, website]],
    );

    expect(result).toEqual({
      ok: true,
      graph: {
        "@context": "https://schema.org",
        "@graph": [organization, website],
      },
    });
  });

  it("deduplicates identical IDs with identical content", () => {
    const organization = buildOrganization();
    const result = composeSchemaGraph(organization, organization);

    expect(result.ok && result.graph?.["@graph"]).toEqual([organization]);
  });

  it("reports conflicting entities sharing an ID", () => {
    const organization = buildOrganization();
    const conflicting = organization
      ? { ...organization, name: "Conflicting Name" }
      : null;
    const result = composeSchemaGraph(organization, conflicting);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].id).toBe(organization?.["@id"]);
    }
  });

  it("omits an empty graph", () => {
    expect(composeSchemaGraph(null, false, [])).toEqual({
      ok: true,
      graph: null,
    });
  });
});

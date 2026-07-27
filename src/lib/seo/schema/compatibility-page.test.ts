import { describe, expect, it } from "vitest";

import { getCompatibilityPath } from "../../compatibility/urls";
import {
  getSpeciesEntityId,
  getWebPageId,
} from "../identities";
import { composeSchemaGraph } from "./graph";
import { buildCompatibilityPageEntities } from "./compatibility-page";

describe("Compatibility Report composition", () => {
  function compose(speciesA: string, speciesB: string) {
    const path = getCompatibilityPath(speciesA, speciesB);
    return composeSchemaGraph(
      buildCompatibilityPageEntities({
        speciesA: { slug: speciesA, name: speciesA },
        speciesB: { slug: speciesB, name: speciesB },
        name: "Compatibility Report",
        description: "Visible compatibility summary.",
        breadcrumbs: [
          { name: "Home", path: "/" },
          { name: "Compatibility", path: "/compatibility" },
          { name: "Compatibility Report", path },
        ],
      }),
    );
  }

  it("references both Species from one canonical WebPage", () => {
    const result = compose("guppy", "betta-splendens");
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const webpage = result.graph?.["@graph"].find(
      (entity) => entity["@type"] === "WebPage",
    );
    expect(webpage).toMatchObject({
      "@id": getWebPageId(
        "/compatibility/betta-splendens/guppy",
      ),
      about: [
        { "@id": getSpeciesEntityId("betta-splendens") },
        { "@id": getSpeciesEntityId("guppy") },
      ],
    });
  });

  it("uses the same page identity for a reversed pair", () => {
    const forward = compose("betta-splendens", "guppy");
    const reversed = compose("guppy", "betta-splendens");
    expect(forward).toEqual(reversed);
  });
});

import { describe, expect, it } from "vitest";

import {
  createDeterministicHash,
  createSourceDataFingerprint,
  getLatestSourceModifiedAt,
  stableJson,
} from "./fingerprint";

describe("Guide generation fingerprints", () => {
  it("canonicalizes object keys without reordering arrays", () => {
    expect(stableJson({ z: 1, a: { y: 2, x: [3, 1] } })).toBe(
      '{"a":{"x":[3,1],"y":2},"z":1}',
    );
    expect(createDeterministicHash({ a: 1, b: 2 })).toBe(
      createDeterministicHash({ b: 2, a: 1 }),
    );
  });

  it("makes source order irrelevant", () => {
    const species = {
      entityType: "species",
      entityKey: "betta-splendens",
      sourceUpdatedAt: "2026-07-01T00:00:00.000Z",
    };
    const compatibility = {
      entityType: "compatibility",
      entityKey: "betta-splendens:honey-gourami",
      sourceVersion: "1",
    };

    expect(
      createSourceDataFingerprint([species, compatibility]),
    ).toBe(createSourceDataFingerprint([compatibility, species]));
  });

  it("changes when tracked source data changes", () => {
    const original = createSourceDataFingerprint([
      { entityType: "species", entityKey: "betta", sourceVersion: "1" },
    ]);
    const changed = createSourceDataFingerprint([
      { entityType: "species", entityKey: "betta", sourceVersion: "2" },
    ]);

    expect(changed).not.toBe(original);
  });

  it("finds the latest valid tracked source timestamp", () => {
    expect(
      getLatestSourceModifiedAt([
        {
          entityType: "species",
          entityKey: "a",
          sourceUpdatedAt: "2026-07-01T00:00:00.000Z",
        },
        {
          entityType: "species",
          entityKey: "b",
          sourceUpdatedAt: "2026-07-03T00:00:00.000Z",
        },
      ]),
    ).toBe("2026-07-03T00:00:00.000Z");
  });
});

import { describe, expect, it } from "vitest";

import { analyzeSharedRange, toNumericRange } from "./ranges";

describe("shared numeric ranges", () => {
  it("calculates the intersection once for complete ranges", () => {
    const result = analyzeSharedRange(
      [
        { id: "a", minimum: 72, maximum: 80 },
        { id: "b", minimum: 74, maximum: 78 },
      ],
      (item) => toNumericRange(item.minimum, item.maximum),
    );

    expect(result).toMatchObject({
      sharedMinimum: 74,
      sharedMaximum: 78,
      hasOverlap: true,
      missingItems: [],
    });
  });

  it("reports conflicts and incomplete ranges without inventing values", () => {
    const conflict = analyzeSharedRange(
      [
        { minimum: 60, maximum: 68 },
        { minimum: 72, maximum: 78 },
      ],
      (item) => toNumericRange(item.minimum, item.maximum),
    );
    const incomplete = analyzeSharedRange(
      [{ minimum: null, maximum: 78 }],
      (item) => toNumericRange(item.minimum, item.maximum),
    );

    expect(conflict.hasOverlap).toBe(false);
    expect(incomplete).toMatchObject({
      sharedMinimum: null,
      sharedMaximum: null,
      hasOverlap: null,
    });
    expect(incomplete.missingItems).toHaveLength(1);
  });
});

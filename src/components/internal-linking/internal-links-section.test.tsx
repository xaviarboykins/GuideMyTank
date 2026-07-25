import { describe, expect, it } from "vitest";

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
});

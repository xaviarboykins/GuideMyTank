import { describe, expect, it } from "vitest";

import { serializeJsonLd } from "./serialize";

describe("safe JSON-LD serialization", () => {
  it("escapes script-breaking and HTML-sensitive content", () => {
    const output = serializeJsonLd({
      value: "</script><span>Fish & chips</span>\u2028\u2029",
    });

    expect(output).not.toContain("</script>");
    expect(output).not.toContain("<span>");
    expect(output).not.toContain("&");
    expect(output).not.toContain("\u2028");
    expect(output).not.toContain("\u2029");
    expect(output).toContain("\\u003c/script\\u003e");
    expect(JSON.parse(output).value).toBe(
      "</script><span>Fish & chips</span>\u2028\u2029",
    );
  });
});

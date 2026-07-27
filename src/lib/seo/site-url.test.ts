import { afterEach, describe, expect, it, vi } from "vitest";

import { getSiteOrigin, getSiteUrl } from "./site-url";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("site URL generation", () => {
  it("uses the preferred production origin", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SITE_URL", "");

    expect(getSiteOrigin()).toBe("https://www.guidemytank.com");
    expect(getSiteUrl("/species/neon-tetra")).toBe(
      "https://www.guidemytank.com/species/neon-tetra",
    );
  });

  it("does not allow an environment override to change canonical identity", () => {
    vi.stubEnv("SITE_URL", "http://guidemytank.com/some/path?preview=1");

    expect(getSiteOrigin()).toBe("https://www.guidemytank.com");
  });

  it("uses the production origin in development and strips query parameters", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("SITE_URL", "http://localhost:4000");

    expect(getSiteUrl("care-guides/neon-tetra?draft=1#section")).toBe(
      "https://www.guidemytank.com/care-guides/neon-tetra",
    );
  });

  it("normalizes an absolute GuideMyTank URL", () => {
    expect(
      getSiteUrl("http://guidemytank.com/species/betta?preview=1#care"),
    ).toBe("https://www.guidemytank.com/species/betta");
  });

  it("rejects absolute URLs on another host", () => {
    expect(() => getSiteUrl("https://example.com/species/betta")).toThrow(
      "canonical production host",
    );
  });
});


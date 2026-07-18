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

  it("normalizes an apex production override to HTTPS and www", () => {
    vi.stubEnv("SITE_URL", "http://guidemytank.com/some/path?preview=1");

    expect(getSiteOrigin()).toBe("https://www.guidemytank.com");
  });

  it("supports a local development origin and strips query parameters", () => {
    vi.stubEnv("SITE_URL", "http://localhost:4000");

    expect(getSiteUrl("care-guides/neon-tetra?draft=1#section")).toBe(
      "http://localhost:4000/care-guides/neon-tetra",
    );
  });
});


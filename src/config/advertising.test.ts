import { describe, expect, it } from "vitest";

import {
  buildAdvertisingConfig,
  normalizeAdSenseClientId,
  normalizeAdSenseSlotId,
} from "./advertising";

const VALID_ENVIRONMENT = {
  ADVERTISING_ENABLED: "true",
  GOOGLE_ADSENSE_CLIENT_ID: "ca-pub-7577700971513069",
  GOOGLE_ADSENSE_SLOT_ARTICLE: "1234567890",
};

describe("advertising configuration", () => {
  it("validates AdSense public identifiers", () => {
    expect(normalizeAdSenseClientId("ca-pub-7577700971513069")).toBe(
      "ca-pub-7577700971513069",
    );
    expect(normalizeAdSenseClientId("pub-7577700971513069")).toBeNull();
    expect(normalizeAdSenseClientId("ca-pub-invalid")).toBeNull();
    expect(normalizeAdSenseSlotId("1234567890")).toBe("1234567890");
    expect(normalizeAdSenseSlotId("1234")).toBeNull();
  });

  it("enables only configured placements in production", () => {
    const config = buildAdvertisingConfig(VALID_ENVIRONMENT, "production");

    expect(config.enabled).toBe(true);
    expect(config.placements["article-in-content"].enabled).toBe(true);
    expect(config.placements["care-guide-overview"].enabled).toBe(false);
  });

  it("stays disabled outside production", () => {
    const config = buildAdvertisingConfig(VALID_ENVIRONMENT, "development");

    expect(config.enabled).toBe(false);
    expect(config.placements["article-in-content"].enabled).toBe(false);
  });

  it("fails closed when publisher configuration is missing or malformed", () => {
    expect(
      buildAdvertisingConfig(
        { ...VALID_ENVIRONMENT, GOOGLE_ADSENSE_CLIENT_ID: "" },
        "production",
      ).enabled,
    ).toBe(false);
    expect(
      buildAdvertisingConfig(
        { ...VALID_ENVIRONMENT, ADVERTISING_ENABLED: "false" },
        "production",
      ).enabled,
    ).toBe(false);
  });

  it("shows placeholders only when explicitly enabled outside production", () => {
    expect(
      buildAdvertisingConfig(
        { ADVERTISING_SHOW_DEV_PLACEHOLDERS: "true" },
        "development",
      ).showDevelopmentPlaceholders,
    ).toBe(true);
    expect(
      buildAdvertisingConfig(
        { ADVERTISING_SHOW_DEV_PLACEHOLDERS: "true" },
        "production",
      ).showDevelopmentPlaceholders,
    ).toBe(false);
  });
});

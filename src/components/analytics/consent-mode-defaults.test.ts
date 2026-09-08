import { describe, expect, it } from "vitest";

import {
  buildConsentModeDefaultsScript,
  GOOGLE_CONSENT_DEFAULTS,
  GOOGLE_CONSENT_REGIONS,
} from "./consent-mode-defaults";

describe("Consent Mode defaults", () => {
  it("denies all Consent Mode v2 storage and advertising signals", () => {
    expect(GOOGLE_CONSENT_DEFAULTS).toMatchObject({
      ad_storage: "denied",
      analytics_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
  });

  it("covers the EEA, United Kingdom, and Switzerland", () => {
    expect(GOOGLE_CONSENT_REGIONS).toContain("GB");
    expect(GOOGLE_CONSENT_REGIONS).toContain("CH");
    expect(GOOGLE_CONSENT_REGIONS).toContain("NO");
    expect(GOOGLE_CONSENT_REGIONS).toContain("IS");
    expect(GOOGLE_CONSENT_REGIONS).toContain("LI");
    expect(GOOGLE_CONSENT_REGIONS).toHaveLength(32);
  });

  it("creates the default command before tags configure measurement", () => {
    const script = buildConsentModeDefaultsScript();

    expect(script).toContain("gtag('consent', 'default'");
    expect(script).toContain("analytics_storage: 'denied'");
    expect(script).toContain("wait_for_update: 3000");
    expect(script).toContain('"wait_for_update":500');
  });
});

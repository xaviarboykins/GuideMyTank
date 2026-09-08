export const GOOGLE_CONSENT_REGIONS = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE",
  "GR", "HU", "IS", "IE", "IT", "LV", "LI", "LT", "LU", "MT", "NL",
  "NO", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "GB", "CH",
] as const;

export const GOOGLE_CONSENT_DEFAULTS = {
  ad_storage: "denied",
  analytics_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  wait_for_update: 500,
} as const;

export function buildConsentModeDefaultsScript() {
  return `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('consent', 'default', {
      analytics_storage: 'denied',
      wait_for_update: 3000
    });
    gtag('consent', 'default', ${JSON.stringify({
      ...GOOGLE_CONSENT_DEFAULTS,
      region: GOOGLE_CONSENT_REGIONS,
    })});
  `;
}

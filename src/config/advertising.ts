import { PLACEMENT_POLICIES } from "../lib/advertising/policy";
import type {
  AdvertisingConfig,
  AdvertisingPlacement,
} from "../lib/advertising/types";

const PLACEMENT_ENVIRONMENT_VARIABLES: Record<AdvertisingPlacement, string> = {
  "article-in-content": "GOOGLE_ADSENSE_SLOT_ARTICLE",
  "care-guide-overview": "GOOGLE_ADSENSE_SLOT_CARE_GUIDE",
  "programmatic-guide-in-content": "GOOGLE_ADSENSE_SLOT_PROGRAMMATIC_GUIDE",
  "compatibility-report-lower": "GOOGLE_ADSENSE_SLOT_COMPATIBILITY_REPORT",
};

export function normalizeAdSenseClientId(value: string | undefined) {
  const clientId = value?.trim() ?? "";
  return /^ca-pub-\d{16}$/.test(clientId) ? clientId : null;
}

export function normalizeAdSenseSlotId(value: string | undefined) {
  const slotId = value?.trim() ?? "";
  return /^\d{10}$/.test(slotId) ? slotId : null;
}

export function buildAdvertisingConfig(
  environment: Record<string, string | undefined>,
  nodeEnvironment: string | undefined,
): AdvertisingConfig {
  const clientId = normalizeAdSenseClientId(
    environment.GOOGLE_ADSENSE_CLIENT_ID,
  );
  const enabled =
    nodeEnvironment === "production" &&
    environment.ADVERTISING_ENABLED === "true" &&
    clientId !== null;

  const placements = Object.fromEntries(
    Object.entries(PLACEMENT_ENVIRONMENT_VARIABLES).map(
      ([placement, variableName]) => {
        const typedPlacement = placement as AdvertisingPlacement;
        const policy = PLACEMENT_POLICIES[typedPlacement];
        const slotId = normalizeAdSenseSlotId(environment[variableName]);

        return [
          typedPlacement,
          {
            enabled: enabled && slotId !== null,
            pageFamily: policy.pageFamily,
            slotId,
            minimumContentUnits: policy.minimumContentUnits,
          },
        ];
      },
    ),
  ) as AdvertisingConfig["placements"];

  return {
    clientId,
    enabled,
    showDevelopmentPlaceholders:
      nodeEnvironment !== "production" &&
      environment.ADVERTISING_SHOW_DEV_PLACEHOLDERS === "true",
    placements,
  };
}

export const advertisingConfig = buildAdvertisingConfig(
  process.env,
  process.env.NODE_ENV,
);

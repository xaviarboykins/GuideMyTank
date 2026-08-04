export const ADVERTISING_PLACEMENTS = [
  "article-in-content",
  "care-guide-overview",
  "programmatic-guide-in-content",
  "compatibility-report-lower",
] as const;

export type AdvertisingPlacement = (typeof ADVERTISING_PLACEMENTS)[number];

export const ADVERTISING_PAGE_FAMILIES = [
  "article",
  "care-guide",
  "programmatic-guide",
  "compatibility-report",
] as const;

export type AdvertisingPageFamily = (typeof ADVERTISING_PAGE_FAMILIES)[number];

export type AdvertisingPlacementConfig = {
  enabled: boolean;
  pageFamily: AdvertisingPageFamily;
  slotId: string | null;
  minimumContentUnits: number;
};

export type AdvertisingConfig = {
  clientId: string | null;
  enabled: boolean;
  showDevelopmentPlaceholders: boolean;
  placements: Record<AdvertisingPlacement, AdvertisingPlacementConfig>;
};

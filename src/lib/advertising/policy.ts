import type {
  AdvertisingPageFamily,
  AdvertisingPlacement,
} from "./types";

export const PLACEMENT_POLICIES: Record<
  AdvertisingPlacement,
  { pageFamily: AdvertisingPageFamily; minimumContentUnits: number }
> = {
  "article-in-content": {
    pageFamily: "article",
    minimumContentUnits: 4,
  },
  "care-guide-overview": {
    pageFamily: "care-guide",
    minimumContentUnits: 6,
  },
  "programmatic-guide-in-content": {
    pageFamily: "programmatic-guide",
    minimumContentUnits: 6,
  },
  "compatibility-report-lower": {
    pageFamily: "compatibility-report",
    minimumContentUnits: 2,
  },
};

export function getAdvertisingPageFamily(
  pathname: string,
): AdvertisingPageFamily | null {
  if (/^\/learning-center\/guides\/[^/]+$/.test(pathname)) {
    return "programmatic-guide";
  }

  if (/^\/learning-center\/[^/]+$/.test(pathname)) {
    return "article";
  }

  if (/^\/care-guides\/[^/]+$/.test(pathname)) {
    return "care-guide";
  }

  if (/^\/compatibility\/[^/]+\/[^/]+$/.test(pathname)) {
    return "compatibility-report";
  }

  return null;
}

export function isRouteAdvertisingAllowed(
  pathname: string,
  pageFamily: AdvertisingPageFamily,
) {
  return getAdvertisingPageFamily(pathname) === pageFamily;
}

export function isPlacementEligible({
  placement,
  pageFamily,
  contentUnits,
}: {
  placement: AdvertisingPlacement;
  pageFamily: AdvertisingPageFamily;
  contentUnits: number;
}) {
  const policy = PLACEMENT_POLICIES[placement];

  return (
    policy.pageFamily === pageFamily &&
    Number.isFinite(contentUnits) &&
    contentUnits >= policy.minimumContentUnits
  );
}

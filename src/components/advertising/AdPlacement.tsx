import { advertisingConfig } from "@/config/advertising";
import { isPlacementEligible } from "@/lib/advertising/policy";
import type {
  AdvertisingPageFamily,
  AdvertisingPlacement,
} from "@/lib/advertising/types";

import { AdSenseScript } from "./AdSenseScript";
import { AdSlot } from "./AdSlot";

export function AdPlacement({
  contentUnits,
  pageFamily,
  placement,
}: {
  contentUnits: number;
  pageFamily: AdvertisingPageFamily;
  placement: AdvertisingPlacement;
}) {
  if (!isPlacementEligible({ placement, pageFamily, contentUnits })) {
    return null;
  }

  if (advertisingConfig.showDevelopmentPlaceholders) {
    return (
      <aside
        aria-label="Advertisement placeholder"
        className="my-8 border border-dashed border-border bg-muted/20 p-4 text-center text-xs text-muted-foreground"
        data-ad-placement={placement}
      >
        Development advertisement placeholder: {placement}
      </aside>
    );
  }

  const placementConfig = advertisingConfig.placements[placement];

  if (
    !advertisingConfig.enabled ||
    !advertisingConfig.clientId ||
    !placementConfig.enabled ||
    !placementConfig.slotId
  ) {
    return null;
  }

  return (
    <>
      <AdSenseScript clientId={advertisingConfig.clientId} />
      <AdSlot
        clientId={advertisingConfig.clientId}
        pageFamily={pageFamily}
        placement={placement}
        slotId={placementConfig.slotId}
      />
    </>
  );
}

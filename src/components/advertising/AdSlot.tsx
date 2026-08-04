"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { isRouteAdvertisingAllowed } from "@/lib/advertising/policy";
import type {
  AdvertisingPageFamily,
  AdvertisingPlacement,
} from "@/lib/advertising/types";

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[];
  }
}

const UNFILLED_TIMEOUT_MS = 12_000;

export function AdSlot({
  clientId,
  pageFamily,
  placement,
  slotId,
}: {
  clientId: string;
  pageFamily: AdvertisingPageFamily;
  placement: AdvertisingPlacement;
  slotId: string;
}) {
  const pathname = usePathname();
  const slotRef = useRef<HTMLModElement>(null);
  const initializedRef = useRef(false);
  const [collapsed, setCollapsed] = useState(false);
  const routeAllowed = isRouteAdvertisingAllowed(pathname, pageFamily);

  useEffect(() => {
    const slot = slotRef.current;

    if (!routeAllowed || !slot || initializedRef.current) return;

    const updateFromAdStatus = () => {
      const status = slot.dataset.adStatus;

      if (status === "unfilled") setCollapsed(true);
      if (status === "filled") setCollapsed(false);
    };

    const statusObserver = new MutationObserver(updateFromAdStatus);
    statusObserver.observe(slot, {
      attributeFilter: ["data-ad-status"],
      attributes: true,
    });

    let unfilledTimeout: number | undefined;

    const initialize = () => {
      if (initializedRef.current) return;

      initializedRef.current = true;

      try {
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.push({});
        unfilledTimeout = window.setTimeout(() => {
          if (slot.dataset.adStatus !== "filled") setCollapsed(true);
        }, UNFILLED_TIMEOUT_MS);
      } catch {
        setCollapsed(true);
      }
    };

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          initialize();
          intersectionObserver.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );

    intersectionObserver.observe(slot);

    return () => {
      if (unfilledTimeout !== undefined) {
        window.clearTimeout(unfilledTimeout);
      }
      intersectionObserver.disconnect();
      statusObserver.disconnect();
    };
  }, [routeAllowed]);

  if (!routeAllowed || collapsed) return null;

  return (
    <aside
      aria-label="Advertisement"
      className="my-8 min-h-[100px] overflow-hidden border-y border-border bg-muted/20 py-3 text-center sm:min-h-[180px] lg:min-h-[250px]"
      data-ad-placement={placement}
    >
      <p className="mb-2 text-[0.6875rem] font-medium uppercase tracking-wide text-muted-foreground">
        Advertisement
      </p>
      <ins
        ref={slotRef}
        className="adsbygoogle block"
        data-ad-client={clientId}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}

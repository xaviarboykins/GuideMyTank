"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { getAnalyticsPageFamily } from "@/lib/analytics/page-family";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function AnalyticsPageView({
  measurementId,
}: {
  measurementId: string;
}) {
  const pathname = usePathname();

  useEffect(() => {
    window.gtag?.("config", measurementId, {
      page_path: pathname,
      page_family: getAnalyticsPageFamily(pathname),
    });
  }, [measurementId, pathname]);

  return null;
}

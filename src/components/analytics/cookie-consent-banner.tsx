"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export const COOKIE_CONSENT_STORAGE_KEY = "guidemytank:cookie-consent";

type CookieConsentChoice = "allow" | "decline";

type TcfData = { gdprApplies?: boolean };
type GppData = { applicableSections?: number[] };

declare global {
  interface Window {
    __guideMyTankOpenPrivacySettings?: () => void;
    googlefc?: {
      callbackQueue?: Array<Record<string, () => void>>;
      showRevocationMessage?: () => void;
    };
    __tcfapi?: (
      command: "addEventListener",
      version: number,
      callback: (data: TcfData | undefined, success: boolean) => void,
    ) => void;
    __gpp?: (
      command: "ping",
      callback: (data: GppData | undefined, success: boolean) => void,
    ) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

function updateAnalyticsConsent(choice: CookieConsentChoice) {
  window.gtag?.("consent", "update", {
    analytics_storage: choice === "allow" ? "granted" : "denied",
  });
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [bannerHeight, setBannerHeight] = useState(0);
  const bannerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let finished = false;
    let tcfApplies = false;
    let gppApplies = false;
    let responses = 0;
    let tcfFinished = false;
    let gppFinished = false;

    const showGlobalBanner = () => {
      if (finished) return;
      finished = true;

      const storedChoice = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
      if (storedChoice === "allow" || storedChoice === "decline") {
        updateAnalyticsConsent(storedChoice);
      } else {
        setVisible(true);
      }

      window.__guideMyTankOpenPrivacySettings = () => setVisible(true);
    };

    const finishFrameworkCheck = () => {
      responses += 1;
      if (responses < 2 || finished) return;

      if (tcfApplies || gppApplies) {
        finished = true;
        window.__guideMyTankOpenPrivacySettings = () =>
          window.googlefc?.showRevocationMessage?.();
        return;
      }

      showGlobalBanner();
    };

    window.googlefc = window.googlefc || {};
    window.googlefc.callbackQueue = window.googlefc.callbackQueue || [];
    window.googlefc.callbackQueue.push({
      CONSENT_API_READY: () => {
        if (typeof window.__tcfapi === "function") {
          window.__tcfapi("addEventListener", 0, (data, success) => {
            if (tcfFinished) return;
            tcfFinished = true;
            tcfApplies = Boolean(success && data?.gdprApplies);
            finishFrameworkCheck();
          });
        } else {
          tcfFinished = true;
          finishFrameworkCheck();
        }

        if (typeof window.__gpp === "function") {
          window.__gpp("ping", (data, success) => {
            if (gppFinished) return;
            gppFinished = true;
            gppApplies = Boolean(
              success && data?.applicableSections?.some((section) => section > 0),
            );
            finishFrameworkCheck();
          });
        } else {
          gppFinished = true;
          finishFrameworkCheck();
        }
      },
    });

    const fallback = window.setTimeout(showGlobalBanner, 2500);

    return () => {
      window.clearTimeout(fallback);
      delete window.__guideMyTankOpenPrivacySettings;
    };
  }, []);

  useEffect(() => {
    const banner = bannerRef.current;

    if (!visible || !banner) {
      setBannerHeight(0);
      return;
    }

    const updateHeight = () => setBannerHeight(banner.getBoundingClientRect().height);
    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(banner);

    return () => observer.disconnect();
  }, [visible]);

  const choose = (choice: CookieConsentChoice) => {
    window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, choice);
    updateAnalyticsConsent(choice);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <>
      <div aria-hidden="true" style={{ height: bannerHeight }} />
      <aside
        ref={bannerRef}
        aria-label="Cookie consent"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-700 bg-black text-white shadow-lg"
      >
        <div className="flex w-full flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-sm leading-6">
            GuideMyTank uses cookies for performance monitoring and to improve the website.{" "}
            <Link href="/privacy" className="font-medium underline">Learn more</Link>
          </p>
          <div className="flex shrink-0 items-center justify-end gap-3">
            <button
              type="button"
              className="min-w-24 px-4 py-2 text-sm font-semibold hover:bg-neutral-800"
              onClick={() => choose("decline")}
            >
              Decline
            </button>
            <button
              type="button"
              className="min-w-28 bg-white px-5 py-2 text-sm font-semibold text-black hover:bg-neutral-100"
              onClick={() => choose("allow")}
            >
              Allow
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

"use client";

import { useEffect, useState } from "react";

export function PrivacySettingsButton() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (window.__guideMyTankOpenPrivacySettings) {
        setReady(true);
        window.clearInterval(timer);
      }
    }, 100);

    return () => window.clearInterval(timer);
  }, []);

  if (!ready) return null;

  return (
    <button
      type="button"
      className="hover:text-foreground"
      onClick={() => window.__guideMyTankOpenPrivacySettings?.()}
    >
      Privacy &amp; Cookie Settings
    </button>
  );
}

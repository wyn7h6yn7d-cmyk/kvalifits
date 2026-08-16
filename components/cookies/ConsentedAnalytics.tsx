"use client";

import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { categoryIsActiveInProduct } from "@/lib/cookies/config";
import {
  COOKIE_CONSENT_CHANGED_EVENT,
  isCategoryAllowed,
  readCookieConsent,
  type CookieConsentState,
} from "@/lib/cookies/consent";

/**
 * Loads Vercel Analytics / Speed Insights only after analytics consent.
 * Never mounts when analytics is inactive in cookie config.
 */
export function ConsentedAnalytics() {
  const [consent, setConsent] = useState<CookieConsentState | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setConsent(readCookieConsent());
    setReady(true);
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<CookieConsentState>).detail;
      setConsent(detail ?? readCookieConsent());
    };
    window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, onChange);
  }, []);

  if (!ready) return null;
  if (!categoryIsActiveInProduct("analytics")) return null;
  if (!isCategoryAllowed(consent, "analytics")) return null;

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}

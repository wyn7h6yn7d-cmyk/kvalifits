"use client";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { categoryIsActiveInProduct } from "@/lib/cookies/config";
import { isCategoryAllowed } from "@/lib/cookies/consent";
import { useCookieConsent, useIsClient } from "@/lib/cookies/useCookieConsent";

/**
 * Loads Vercel Analytics / Speed Insights only after analytics consent.
 * Never mounts when analytics is inactive in cookie config.
 */
export function ConsentedAnalytics() {
  const isClient = useIsClient();
  const consent = useCookieConsent();

  if (!isClient) return null;
  if (!categoryIsActiveInProduct("analytics")) return null;
  if (!isCategoryAllowed(consent, "analytics")) return null;

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}

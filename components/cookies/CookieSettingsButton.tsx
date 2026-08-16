"use client";

import { useTranslations } from "next-intl";

import { cookieConsentUiRequired } from "@/lib/cookies/config";
import { openCookieSettings } from "@/lib/cookies/consent";

/** Footer / policy control to reopen cookie settings when optional cookies exist. */
export function CookieSettingsButton({ className }: { className?: string }) {
  const t = useTranslations("cookieConsent");
  if (!cookieConsentUiRequired()) return null;

  return (
    <button type="button" className={className} onClick={() => openCookieSettings()}>
      {t("openSettings")}
    </button>
  );
}

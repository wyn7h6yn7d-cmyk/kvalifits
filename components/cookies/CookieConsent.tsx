"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { useCookieConsent, useIsClient } from "@/lib/cookies/useCookieConsent";

import {
  COOKIE_CATEGORY_META,
  activeOptionalCategories,
  cookieConsentUiRequired,
  type CookieCategoryId,
} from "@/lib/cookies/config";
import {
  COOKIE_OPEN_SETTINGS_EVENT,
  defaultConsentAccepted,
  defaultConsentDenied,
  readCookieConsent,
  writeCookieConsent,
  type CookieConsentState,
} from "@/lib/cookies/consent";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/**
 * Consent banner + settings. Renders nothing when only necessary cookies are active.
 */
export function CookieConsent() {
  const t = useTranslations("cookieConsent");
  const locale = useLocale() as "et" | "en" | "ru";
  const needsUi = cookieConsentUiRequired();
  const optionalCats = useMemo(() => activeOptionalCategories(), []);
  const isClient = useIsClient();
  const consent = useCookieConsent();

  const [bannerOpen, setBannerOpen] = useState(false);
  const [bannerSeeded, setBannerSeeded] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draftAnalytics, setDraftAnalytics] = useState(false);
  const [draftMarketing, setDraftMarketing] = useState(false);

  if (isClient && !bannerSeeded) {
    setBannerSeeded(true);
    setBannerOpen(needsUi && !consent);
  }

  useEffect(() => {
    const onOpenSettings = () => {
      if (!needsUi) return;
      const current = readCookieConsent() ?? defaultConsentDenied();
      setDraftAnalytics(current.analytics);
      setDraftMarketing(current.marketing);
      setSettingsOpen(true);
      setBannerOpen(false);
    };
    window.addEventListener(COOKIE_OPEN_SETTINGS_EVENT, onOpenSettings);
    return () => window.removeEventListener(COOKIE_OPEN_SETTINGS_EVENT, onOpenSettings);
  }, [needsUi]);

  if (!needsUi || !isClient) return null;

  function persist(next: CookieConsentState) {
    writeCookieConsent(next);
    setBannerOpen(false);
    setSettingsOpen(false);
  }

  function onAccept() {
    persist(defaultConsentAccepted());
  }

  function onDecline() {
    persist(defaultConsentDenied());
  }

  function onOpenSettingsFromBanner() {
    const current = consent ?? defaultConsentDenied();
    setDraftAnalytics(current.analytics);
    setDraftMarketing(current.marketing);
    setSettingsOpen(true);
    setBannerOpen(false);
  }

  function onSaveSettings() {
    persist({
      ...defaultConsentDenied(),
      analytics: optionalCats.includes("analytics") ? draftAnalytics : false,
      marketing: optionalCats.includes("marketing") ? draftMarketing : false,
    });
  }

  function categoryLabel(id: CookieCategoryId) {
    return COOKIE_CATEGORY_META[id].label[locale];
  }

  function categoryDescription(id: CookieCategoryId) {
    return COOKIE_CATEGORY_META[id].description[locale];
  }

  return (
    <>
      {bannerOpen ? (
        <div
          className="fixed inset-x-0 z-[60] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6"
          style={{ bottom: "var(--site-bottom-nav-offset, 0px)" }}
          role="dialog"
          aria-modal="false"
          aria-labelledby="cookie-consent-title"
        >
          <div className="mx-auto max-w-3xl rounded-3xl border border-white/[0.12] bg-zinc-950 p-5 sm:p-6">
            <div id="cookie-consent-title" className="text-sm font-semibold text-white/90">
              {t("title")}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-white/60">
              {t("body")}{" "}
              <Link href="/kupsised" className="underline-offset-2 hover:underline">
                {t("policyLink")}
              </Link>
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button type="button" variant="primary" className="sm:flex-1" onClick={onAccept}>
                {t("accept")}
              </Button>
              <Button type="button" variant="outline" className="sm:flex-1" onClick={onDecline}>
                {t("decline")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="sm:flex-1"
                onClick={onOpenSettingsFromBanner}
              >
                {t("settings")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {settingsOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-settings-title"
          onClick={() => setSettingsOpen(false)}
        >
          <div
            className="max-h-[min(90dvh,40rem)] w-full overflow-y-auto rounded-t-3xl border border-white/[0.12] bg-zinc-950 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl sm:max-h-none sm:max-w-md sm:rounded-3xl sm:p-6 sm:pb-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div id="cookie-settings-title" className="text-sm font-semibold text-white/90">
              {t("settingsTitle")}
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-white/55">{t("settingsHint")}</p>

            <div className="mt-4 space-y-3">
              <CategoryRow
                title={categoryLabel("necessary")}
                description={categoryDescription("necessary")}
                checked
                disabled
              />
              {optionalCats.includes("analytics") ? (
                <CategoryRow
                  title={categoryLabel("analytics")}
                  description={categoryDescription("analytics")}
                  checked={draftAnalytics}
                  onChange={setDraftAnalytics}
                />
              ) : null}
              {optionalCats.includes("marketing") ? (
                <CategoryRow
                  title={categoryLabel("marketing")}
                  description={categoryDescription("marketing")}
                  checked={draftMarketing}
                  onChange={setDraftMarketing}
                />
              ) : null}
            </div>

            <div className="mt-5 flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setSettingsOpen(false)}
              >
                {t("cancel")}
              </Button>
              <Button type="button" variant="primary" className="flex-1" onClick={onSaveSettings}>
                {t("save")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function CategoryRow({
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <label
      className={cn(
        "flex min-h-11 cursor-pointer items-start gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-3",
        disabled && "cursor-default opacity-80"
      )}
    >
      <input
        type="checkbox"
        className="mt-1 h-5 w-5 shrink-0 border-white/[0.20] bg-white/[0.03]"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
      />
      <span className="min-w-0">
        <span className="block text-sm text-white/85">{title}</span>
        <span className="mt-0.5 block text-[11px] leading-snug text-white/50">{description}</span>
      </span>
    </label>
  );
}

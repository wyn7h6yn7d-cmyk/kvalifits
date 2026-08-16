import {
  COOKIE_CONSENT_STORAGE_KEY,
  COOKIE_CONSENT_VERSION,
  activeOptionalCategories,
  cookieConsentUiRequired,
  type CookieCategoryId,
} from "@/lib/cookies/config";

export type CookieConsentState = {
  version: number;
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
};

export const COOKIE_CONSENT_CHANGED_EVENT = "kvalifits:cookie-consent-changed";
export const COOKIE_OPEN_SETTINGS_EVENT = "kvalifits:open-cookie-settings";

export function defaultConsentDenied(): CookieConsentState {
  return {
    version: COOKIE_CONSENT_VERSION,
    necessary: true,
    analytics: false,
    marketing: false,
    updatedAt: new Date().toISOString(),
  };
}

export function defaultConsentAccepted(): CookieConsentState {
  const optional = activeOptionalCategories();
  return {
    version: COOKIE_CONSENT_VERSION,
    necessary: true,
    analytics: optional.includes("analytics"),
    marketing: optional.includes("marketing"),
    updatedAt: new Date().toISOString(),
  };
}

export function readCookieConsent(): CookieConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CookieConsentState>;
    if (parsed.version !== COOKIE_CONSENT_VERSION) return null;
    return {
      version: COOKIE_CONSENT_VERSION,
      necessary: true,
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function writeCookieConsent(state: CookieConsentState): void {
  if (typeof window === "undefined") return;
  const next: CookieConsentState = {
    ...state,
    version: COOKIE_CONSENT_VERSION,
    necessary: true,
    updatedAt: new Date().toISOString(),
  };
  // Never enable categories that are not active in product config.
  const optional = activeOptionalCategories();
  if (!optional.includes("analytics")) next.analytics = false;
  if (!optional.includes("marketing")) next.marketing = false;

  window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_CHANGED_EVENT, { detail: next }));
}

export function openCookieSettings(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(COOKIE_OPEN_SETTINGS_EVENT));
}

export function isCategoryAllowed(
  consent: CookieConsentState | null,
  category: CookieCategoryId
): boolean {
  if (category === "necessary") return true;
  if (!cookieConsentUiRequired()) {
    // No optional tech → nothing to allow beyond necessary.
    return false;
  }
  if (!consent) return false;
  if (category === "analytics") return consent.analytics === true;
  if (category === "marketing") return consent.marketing === true;
  return false;
}

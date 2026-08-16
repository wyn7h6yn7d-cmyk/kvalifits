/**
 * Single source of truth for cookies / similar tech on Kvalifits.
 * Consent UI and cookie policy both derive from this config.
 */

export const COOKIE_CONSENT_STORAGE_KEY = "kvalifits_cookie_consent_v1";
export const COOKIE_CONSENT_VERSION = 1;

export type CookieCategoryId = "necessary" | "analytics" | "marketing";

export type CookieLocaleCopy = {
  et: string;
  en: string;
  ru: string;
};

export type CookieTechEntry = {
  id: string;
  /** Cookie name, storage key, or product name when not a classic cookie. */
  name: string;
  provider: string;
  category: CookieCategoryId;
  /** cookie | local_storage | script (script = loads third-party analytics/insights) */
  kind: "cookie" | "local_storage" | "script";
  /**
   * When false, the entry is reserved for future use and must NOT trigger consent UI
   * or be listed as currently loaded.
   */
  active: boolean;
  purpose: CookieLocaleCopy;
};

export const COOKIE_CATEGORY_META: Record<
  CookieCategoryId,
  { required: boolean; label: CookieLocaleCopy; description: CookieLocaleCopy }
> = {
  necessary: {
    required: true,
    label: {
      et: "Hädavajalikud",
      en: "Strictly necessary",
      ru: "Строго необходимые",
    },
    description: {
      et: "Autentimine, seanss, keele-eelistus ja nõusoleku mäletamine. Neid ei saa välja lülitada.",
      en: "Authentication, session, language preference and remembering your consent. These cannot be turned off.",
      ru: "Аутентификация, сессия, язык и сохранение согласия. Их нельзя отключить.",
    },
  },
  analytics: {
    required: false,
    label: {
      et: "Analüütika",
      en: "Analytics",
      ru: "Аналитика",
    },
    description: {
      et: "Anonüümne või pseudonümiseeritud kasutusstatistika (nt lehevaatamised, jõudlus).",
      en: "Anonymous or pseudonymous usage statistics (e.g. page views, performance).",
      ru: "Анонимная или псевдонимизированная статистика использования (просмотры, производительность).",
    },
  },
  marketing: {
    required: false,
    label: {
      et: "Turundus",
      en: "Marketing",
      ru: "Маркетинг",
    },
    description: {
      et: "Sihtimine või konversioonide mõõtmine. Praegu Kvalifitsis ei kasutata.",
      en: "Targeting or conversion tracking. Not currently used on Kvalifits.",
      ru: "Таргетинг или измерение конверсий. Сейчас на Kvalifits не используется.",
    },
  },
};

/**
 * Actual technologies in the product codebase.
 * Toggle `active` when adding/removing analytics or marketing scripts.
 */
export const COOKIE_TECH_ENTRIES: readonly CookieTechEntry[] = [
  {
    id: "supabase-auth",
    name: "sb-*-auth-token (ja seotud Supabase auth küpsised)",
    provider: "Supabase",
    category: "necessary",
    kind: "cookie",
    active: true,
    purpose: {
      et: "Sisselogimise seansi hoidmine ja turvaline API ligipääs.",
      en: "Keeping you signed in and securing API access.",
      ru: "Поддержание сессии входа и безопасный доступ к API.",
    },
  },
  {
    id: "next-locale",
    name: "NEXT_LOCALE",
    provider: "Kvalifits / next-intl",
    category: "necessary",
    kind: "cookie",
    active: true,
    purpose: {
      et: "Keele-eelistuse mäletamine (ET / EN / RU).",
      en: "Remembering language preference (ET / EN / RU).",
      ru: "Сохранение выбранного языка (ET / EN / RU).",
    },
  },
  {
    id: "consent-preference",
    name: COOKIE_CONSENT_STORAGE_KEY,
    provider: "Kvalifits",
    category: "necessary",
    kind: "local_storage",
    active: true,
    purpose: {
      et: "Küpsiste nõusoleku valiku salvestamine seadmesse.",
      en: "Storing your cookie consent choice on this device.",
      ru: "Сохранение вашего выбора согласия на этом устройстве.",
    },
  },
  {
    id: "vercel-analytics",
    name: "Vercel Analytics",
    provider: "Vercel",
    category: "analytics",
    kind: "script",
    active: true,
    purpose: {
      et: "Agregatsiooniline lehekülastuste statistika (laaditakse ainult nõusolekul).",
      en: "Aggregated page-view analytics (loaded only with consent).",
      ru: "Агрегированная статистика просмотров (загружается только с согласия).",
    },
  },
  {
    id: "vercel-speed-insights",
    name: "Vercel Speed Insights",
    provider: "Vercel",
    category: "analytics",
    kind: "script",
    active: true,
    purpose: {
      et: "Jõudluse mõõtmine (laaditakse ainult nõusolekul).",
      en: "Performance measurement (loaded only with consent).",
      ru: "Измерение производительности (загружается только с согласия).",
    },
  },
  // Marketing reserved — inactive so it must not show a marketing consent ask.
  {
    id: "marketing-placeholder",
    name: "—",
    provider: "—",
    category: "marketing",
    kind: "script",
    active: false,
    purpose: {
      et: "Turundustehnoloogiaid praegu ei kasutata.",
      en: "No marketing technologies are currently used.",
      ru: "Маркетинговые технологии сейчас не используются.",
    },
  },
] as const;

export function activeCookieEntries(): CookieTechEntry[] {
  return COOKIE_TECH_ENTRIES.filter((e) => e.active);
}

export function activeEntriesForCategory(category: CookieCategoryId): CookieTechEntry[] {
  return activeCookieEntries().filter((e) => e.category === category);
}

/** Optional categories that are actually in use — drives whether consent UI is shown. */
export function activeOptionalCategories(): CookieCategoryId[] {
  const set = new Set<CookieCategoryId>();
  for (const e of activeCookieEntries()) {
    if (e.category !== "necessary") set.add(e.category);
  }
  return Array.from(set);
}

/**
 * True only when analytics and/or marketing tech is actually enabled.
 * If only necessary auth/session cookies exist, do NOT show a marketing-style consent banner.
 */
export function cookieConsentUiRequired(): boolean {
  return activeOptionalCategories().length > 0;
}

export function categoryIsActiveInProduct(category: CookieCategoryId): boolean {
  if (category === "necessary") return true;
  return activeOptionalCategories().includes(category);
}

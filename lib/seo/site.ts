import type { Metadata } from "next";

import { routing, type AppLocale } from "@/i18n/routing";

export const SITE_ORIGIN = "https://kvalifits.ee";
export const SITE_NAME = "Kvalifits";

export const SEO_LOCALES = routing.locales;
export const SEO_DEFAULT_LOCALE = routing.defaultLocale;

/** Public marketing / content paths (no locale prefix). */
export const PUBLIC_STATIC_PATHS = [
  "",
  "/tood",
  "/toootsijatele",
  "/tooandjatele",
  "/kontakt",
  "/privaatsus",
  "/tingimused",
  "/kupsised",
  "/andmekaitse",
  "/ettevote",
  "/ettevotted",
] as const;

/** Path prefixes that must not be crawled or indexed (no locale prefix). */
export const NOINDEX_PATH_PREFIXES = [
  "/auth",
  "/account",
  "/admin",
  "/onboarding",
  "/blocked",
  "/hinnakiri",
] as const;

export function normalizePathWithoutLocale(path: string): string {
  if (!path || path === "/") return "";
  const withSlash = path.startsWith("/") ? path : `/${path}`;
  return withSlash.replace(/\/+$/, "") || "";
}

/** e.g. (`et`, `/tood`) → `/et/tood`; (`et`, ``) → `/et` */
export function localizedPath(locale: string, pathWithoutLocale: string): string {
  const p = normalizePathWithoutLocale(pathWithoutLocale);
  return p ? `/${locale}${p}` : `/${locale}`;
}

export function absoluteUrl(locale: string, pathWithoutLocale: string): string {
  return `${SITE_ORIGIN}${localizedPath(locale, pathWithoutLocale)}`;
}

/** hreflang map including x-default → Estonian. */
export function hreflangLanguages(pathWithoutLocale: string): Record<string, string> {
  const p = normalizePathWithoutLocale(pathWithoutLocale);
  return {
    et: absoluteUrl("et", p),
    en: absoluteUrl("en", p),
    ru: absoluteUrl("ru", p),
    "x-default": absoluteUrl(SEO_DEFAULT_LOCALE, p),
  };
}

export function localeAlternates(locale: string, pathWithoutLocale: string): NonNullable<Metadata["alternates"]> {
  const p = normalizePathWithoutLocale(pathWithoutLocale);
  return {
    canonical: absoluteUrl(locale, p),
    languages: hreflangLanguages(p),
  };
}

export function ogLocaleTag(locale: string): string {
  if (locale === "en") return "en_GB";
  if (locale === "ru") return "ru_RU";
  return "et_EE";
}

export function ogAlternateLocales(locale: string): string[] {
  return SEO_LOCALES.filter((l) => l !== locale).map(ogLocaleTag);
}

export const NOINDEX_ROBOTS: Metadata["robots"] = {
  index: false,
  follow: false,
  googleBot: { index: false, follow: false },
};

/** Filter / search-query URLs: do not index duplicates; still follow links to jobs. */
export const NOINDEX_FOLLOW: Metadata["robots"] = {
  index: false,
  follow: true,
  googleBot: { index: false, follow: true },
};

const TRACKING_SEARCH_PARAM = /^(utm_|gclid$|gbraid$|wbraid$|fbclid$|msclkid$|ttclid$|_ga$|mc_cid$|mc_eid$)/i;

function searchParamHasValue(value: string | string[] | undefined): boolean {
  if (value == null) return false;
  if (Array.isArray(value)) return value.some((v) => String(v).trim().length > 0);
  return String(value).trim().length > 0;
}

/**
 * True when the URL has query params that would create a duplicate landing page
 * (filters, sort, search). Tracking params alone do not count.
 */
export function searchParamsIndicateDuplicateLanding(
  sp: URLSearchParams | Record<string, string | string[] | undefined>,
): boolean {
  const keys =
    sp instanceof URLSearchParams
      ? [...new Set([...sp.keys()])].filter((k) => searchParamHasValue(sp.getAll(k)))
      : Object.keys(sp).filter((k) => searchParamHasValue(sp[k]));
  return keys.some((k) => !TRACKING_SEARCH_PARAM.test(k));
}

export function jsonLdScriptHtml(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** Shared metadata for public, indexable locale pages. */
export function publicPageMetadata(opts: {
  locale: string;
  /** Path without locale prefix, e.g. `/tood` or `` for home. */
  path: string;
  title?: string | Metadata["title"];
  description?: string;
  robots?: Metadata["robots"];
}): Metadata {
  const locale = opts.locale as AppLocale;
  const path = normalizePathWithoutLocale(opts.path);
  const url = absoluteUrl(locale, path);
  const titleString = typeof opts.title === "string" ? opts.title : undefined;

  return {
    ...(opts.title !== undefined ? { title: opts.title } : {}),
    ...(opts.description !== undefined ? { description: opts.description } : {}),
    ...(opts.robots !== undefined ? { robots: opts.robots } : {}),
    alternates: localeAlternates(locale, path),
    openGraph: {
      type: "website",
      url,
      siteName: SITE_NAME,
      locale: ogLocaleTag(locale),
      alternateLocale: ogAlternateLocales(locale),
      ...(titleString ? { title: titleString } : {}),
      ...(opts.description ? { description: opts.description } : {}),
    },
    twitter: {
      card: "summary",
      ...(titleString ? { title: titleString } : {}),
      ...(opts.description ? { description: opts.description } : {}),
    },
  };
}

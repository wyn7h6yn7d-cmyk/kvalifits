import { routing, type AppLocale } from "@/i18n/routing";

export type ErrorCopy = {
  title: string;
  body: string;
  retry: string;
};

const COPY: Record<AppLocale, ErrorCopy> = {
  et: {
    title: "Leht läks katki",
    body: "Proovi uuesti. Kui viga kordub, tule hiljem tagasi.",
    retry: "Proovi uuesti",
  },
  en: {
    title: "This page broke",
    body: "Try again. If it keeps happening, come back later.",
    retry: "Try again",
  },
  ru: {
    title: "Страница сломалась",
    body: "Попробуйте ещё раз. Если ошибка повторяется, вернитесь позже.",
    retry: "Попробовать снова",
  },
};

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return value === "et" || value === "en" || value === "ru";
}

export function localeFromCookieHeader(cookieHeader: string | null | undefined): AppLocale {
  const match = String(cookieHeader ?? "").match(/(?:^|;\s*)NEXT_LOCALE=(et|en|ru)(?:;|$)/);
  return isAppLocale(match?.[1]) ? match[1] : routing.defaultLocale;
}

export function errorCopyForLocale(locale: string | null | undefined): ErrorCopy {
  return COPY[isAppLocale(locale) ? locale : routing.defaultLocale];
}

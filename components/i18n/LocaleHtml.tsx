"use client";

import { useLocale } from "next-intl";
import { useEffect } from "react";

/** Juur-`<html lang>` jääb staatiliseks; see sünkib `lang` tegeliku locale’iga. */
export function LocaleHtml() {
  const locale = useLocale();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}

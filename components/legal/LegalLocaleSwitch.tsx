"use client";

import { useLocale, useTranslations } from "next-intl";

import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const FLAGS: Record<string, string> = {
  et: "🇪🇪",
  en: "🇬🇧",
  ru: "🇷🇺",
};

export function LegalLocaleSwitch({ docPath }: { docPath: string }) {
  const current = useLocale();
  const t = useTranslations("language");

  return (
    <nav
      aria-label={t("switchTo")}
      className="flex flex-wrap items-center gap-1 rounded-xl border border-white/[0.10] bg-white/[0.04] p-0.5"
    >
      {routing.locales.map((loc) => {
        const active = current === loc;
        return (
          <Link
            key={loc}
            href={docPath}
            locale={loc}
            className={cn(
              "flex items-center gap-1.5 rounded-[10px] px-2.5 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition-colors",
              active
                ? "bg-white/[0.10] text-white"
                : "text-white/45 hover:bg-white/[0.06] hover:text-white/80"
            )}
            hrefLang={loc}
          >
            <span aria-hidden className="text-[14px] leading-none">
              {FLAGS[loc]}
            </span>
            {t(loc as "et" | "en" | "ru")}
          </Link>
        );
      })}
    </nav>
  );
}

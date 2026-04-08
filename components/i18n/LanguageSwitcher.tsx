"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { routing } from "@/i18n/routing";
import { usePathname, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const FLAGS: Record<string, string> = {
  et: "🇪🇪",
  en: "🇬🇧",
  ru: "🇷🇺",
};

const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function persistLocalePreference(next: string) {
  try {
    localStorage.setItem("NEXT_LOCALE", next);
    if (typeof globalThis.document !== "undefined") {
      globalThis.document.cookie = `NEXT_LOCALE=${next};path=/;max-age=${LOCALE_COOKIE_MAX_AGE};SameSite=Lax`;
    }
  } catch {
    /* ignore */
  }
}

const triggerClass =
  "flex w-full items-center justify-center gap-1 rounded-lg border border-white/[0.12] bg-white/[0.04] px-1.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-colors";

const itemClass =
  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors";

function useLgHover() {
  const [lg, setLg] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setLg(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return lg;
}

export function LanguageSwitcher({
  className,
  triggerClassName,
}: {
  className?: string;
  /** Navbar jms: fikseeritud kõrgus, et joondus CTA-dega ühtiks */
  triggerClassName?: string;
}) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("language");
  const lgHover = useLgHover();
  const [hovered, setHovered] = useState(false);
  const [touchOpen, setTouchOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const switchLocale = useCallback(
    (next: string) => {
      persistLocalePreference(next);
      router.replace(pathname, { locale: next });
      setTouchOpen(false);
      setHovered(false);
    },
    [pathname, router],
  );

  const others = routing.locales.filter((l) => l !== locale);
  const menuOpen = lgHover ? hovered : touchOpen;

  useEffect(() => {
    if (!touchOpen || lgHover) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setTouchOpen(false);
    };
    document.addEventListener("click", onDoc, true);
    return () => document.removeEventListener("click", onDoc, true);
  }, [touchOpen, lgHover]);

  return (
    <div
      ref={rootRef}
      className={cn("relative inline-block", className)}
      onMouseEnter={() => lgHover && setHovered(true)}
      onMouseLeave={() => lgHover && setHovered(false)}
    >
      <button
        type="button"
        onClick={() => {
          if (!lgHover) setTouchOpen((o) => !o);
        }}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        aria-label={t(locale as "et" | "en" | "ru")}
        className={cn(
          triggerClass,
          "text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]",
          "bg-gradient-to-r from-violet-500/20 via-fuchsia-500/12 to-transparent",
          menuOpen && "border-white/[0.16]",
          triggerClassName,
        )}
      >
        <span className="text-[12px] leading-none" aria-hidden>
          {FLAGS[locale]}
        </span>
        <span>{t(locale as "et" | "en" | "ru")}</span>
      </button>

      {/* pt-1 = hiire sild nupu ja menüü vahel (hover ei kao vahesse) */}
      <div
        className={cn(
          "absolute right-0 top-full z-[70] min-w-full pt-1 transition-[opacity,transform,visibility] duration-200 ease-out",
          menuOpen
            ? "visible translate-y-0 opacity-100"
            : "invisible pointer-events-none -translate-y-1 opacity-0",
        )}
      >
        <div
          role="menu"
          aria-label={t("switchTo")}
          className="flex flex-col gap-0.5 rounded-lg border border-white/[0.14] bg-black/92 p-0.5 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.85)] backdrop-blur-md"
        >
          {others.map((loc) => (
            <button
              key={loc}
              type="button"
              role="menuitem"
              onClick={() => switchLocale(loc)}
              aria-label={t(loc as "et" | "en" | "ru")}
              className={cn(
                itemClass,
                "text-white/55 hover:bg-white/[0.08] hover:text-white/95",
              )}
            >
              <span className="text-[12px] leading-none" aria-hidden>
                {FLAGS[loc]}
              </span>
              <span>{t(loc as "et" | "en" | "ru")}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { Check, ChevronDown, Globe2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { usePathname, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const LOCALES = [
  { code: "et", nativeName: "Eesti" },
  { code: "en", nativeName: "English" },
  { code: "ru", nativeName: "Русский" },
] as const;

type LocaleCode = (typeof LOCALES)[number]["code"];

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
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [open, setOpen] = useState(false);

  const current = (LOCALES.find((l) => l.code === locale) ?? LOCALES[0]).code;
  const currentIndex = LOCALES.findIndex((l) => l.code === current);

  const close = useCallback((restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  const switchLocale = useCallback(
    (next: string) => {
      persistLocalePreference(next);
      setOpen(false);
      if (next === locale) return;
      router.replace(pathname, { locale: next });
    },
    [locale, pathname, router],
  );

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close(true);
      }
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const target = itemRefs.current[currentIndex] ?? itemRefs.current[0];
    target?.focus();
  }, [open, currentIndex]);

  function onTriggerKeyDown(e: ReactKeyboardEvent<HTMLButtonElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
    }
  }

  function onMenuKeyDown(e: ReactKeyboardEvent<HTMLDivElement>) {
    const count = LOCALES.length;
    const active = itemRefs.current.findIndex((el) => el === document.activeElement);
    const from = active >= 0 ? active : currentIndex;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      itemRefs.current[(from + 1) % count]?.focus();
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      itemRefs.current[(from - 1 + count) % count]?.focus();
      return;
    }
    if (e.key === "Home") {
      e.preventDefault();
      itemRefs.current[0]?.focus();
      return;
    }
    if (e.key === "End") {
      e.preventDefault();
      itemRefs.current[count - 1]?.focus();
      return;
    }
    if (e.key === "Tab") {
      close();
    }
  }

  return (
    <div ref={rootRef} className={cn("relative inline-flex", className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onTriggerKeyDown}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-label={t("switchTo")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md bg-transparent px-2 font-medium text-muted transition-colors",
          "hover:bg-[#f5f7fb] hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30",
          open && "bg-[#f8fafc] text-foreground",
          triggerClassName,
        )}
      >
        <Globe2 className="h-3.5 w-3.5 shrink-0 opacity-80" strokeWidth={1.75} aria-hidden />
        <span className="uppercase">{t(current as LocaleCode)}</span>
        <ChevronDown
          className={cn("h-3 w-3 shrink-0 opacity-70 transition-transform duration-150", open && "rotate-180")}
          strokeWidth={2}
          aria-hidden
        />
      </button>

      <div
        className={cn(
          "absolute right-0 top-full z-[70] pt-1.5 transition-[opacity,transform,visibility] duration-150 ease-out",
          open ? "visible translate-y-0 opacity-100" : "invisible pointer-events-none -translate-y-0.5 opacity-0",
        )}
        aria-hidden={!open}
        inert={!open ? true : undefined}
      >
        <div
          id={menuId}
          role="menu"
          aria-label={t("switchTo")}
          onKeyDown={onMenuKeyDown}
          className="w-[160px] rounded-xl border border-border bg-white p-2 shadow-[0_12px_28px_-14px_rgba(15,23,42,0.14)]"
        >
          {LOCALES.map((item, index) => {
            const active = item.code === current;
            return (
              <button
                key={item.code}
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                type="button"
                role="menuitem"
                tabIndex={-1}
                aria-current={active ? "true" : undefined}
                onClick={() => switchLocale(item.code)}
                className={cn(
                  "flex h-11 w-full items-center gap-2 rounded-md px-2.5 text-left text-[0.9375rem] leading-snug transition-colors lg:h-9",
                  "text-muted hover:bg-[#f5f7fb] hover:text-foreground",
                  "focus-visible:bg-[#f5f7fb] focus-visible:text-foreground focus-visible:outline-none",
                  active && "text-foreground",
                )}
              >
                <span className="min-w-0 flex-1 truncate">{item.nativeName}</span>
                <span className="text-[0.75rem] font-medium text-muted">
                  {t(item.code)}
                </span>
                <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center">
                  {active ? <Check className="h-3.5 w-3.5 text-foreground/80" strokeWidth={2} aria-hidden /> : null}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

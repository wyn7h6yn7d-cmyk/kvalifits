"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/** Registreerimisvormi all; hilisemaks checkbox’iks jäta tekst ja lingid samaks. */
export function RegistrationConsentText({ className }: { className?: string }) {
  const t = useTranslations("consent");

  return (
    <p className={cn("max-w-lg text-pretty text-[0.9375rem] leading-[1.6] text-muted", className)}>
      {t("before")}
      <Link
        href="/tingimused"
        className="underline decoration-border-strong underline-offset-2 hover:decoration-foreground/40"
      >
        {t("terms")}
      </Link>
      {t("between")}
      <Link
        href="/privaatsus"
        className="underline decoration-border-strong underline-offset-2 hover:decoration-foreground/40"
      >
        {t("privacy")}
      </Link>
      {t("after")}
    </p>
  );
}

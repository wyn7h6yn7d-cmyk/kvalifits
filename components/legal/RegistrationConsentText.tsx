"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/** Registreerimisvormi all; hilisemaks checkbox’iks jäta tekst ja lingid samaks. */
export function RegistrationConsentText({ className }: { className?: string }) {
  const t = useTranslations("consent");

  return (
    <p className={cn("max-w-lg text-sm leading-relaxed text-white/52", className)}>
      {t("before")}
      <Link
        href="/tingimused"
        className="underline decoration-white/25 underline-offset-2 hover:decoration-white/50"
      >
        {t("terms")}
      </Link>
      {t("between")}
      <Link
        href="/privaatsus"
        className="underline decoration-white/25 underline-offset-2 hover:decoration-white/50"
      >
        {t("privacy")}
      </Link>
      {t("after")}
    </p>
  );
}

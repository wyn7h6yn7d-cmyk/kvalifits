"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { reportException } from "@/lib/monitoring/report";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");

  useEffect(() => {
    reportException(error, {
      area: "client",
      code: "locale_error_boundary",
      extras: { digest: error.digest ?? null },
    });
  }, [error]);

  return (
    <main className="mx-auto max-w-lg px-6 py-24">
      <h1 className="text-2xl font-semibold tracking-tight text-white">{t("title")}</h1>
      <p className="mt-3 text-sm leading-6 text-white/70">{t("body")}</p>
      <Button type="button" className="mt-8" onClick={() => reset()}>
        {t("retry")}
      </Button>
    </main>
  );
}

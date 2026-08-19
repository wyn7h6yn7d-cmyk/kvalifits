"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { reportException } from "@/lib/monitoring/report";

export default function AccountError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");

  useEffect(() => {
    // Account routes should show generic copy; underlying details go only to monitoring.
    reportException(error, {
      area: "client",
      code: "account_error_boundary",
      extras: { digest: error.digest ?? null },
    });
  }, [error]);

  return (
    <main className="mx-auto max-w-lg px-6 py-24">
      <h1 className="text-2xl font-semibold tracking-tight text-white">{t("title")}</h1>
      <p className="mt-3 text-sm leading-6 text-white/70">{t("body")}</p>

      <div className="mt-8 flex flex-col gap-3">
        <Button type="button" onClick={() => reset()}>
          {t("retry")}
        </Button>

        <Button asChild type="button" variant="outline">
          <Link href="/account">{t("accountHome")}</Link>
        </Button>
      </div>
    </main>
  );
}


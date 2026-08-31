"use client";

import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export function AlreadySignedIn() {
  const t = useTranslations("auth");
  const locale = useLocale();

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-[#f8fafc] p-5 text-sm text-muted">
        {t("alreadySignedIn")}
      </div>
      <form action={`/${locale}/auth/logout`} method="post">
        <Button variant="outline" className="w-full" type="submit">
          {t("logout")}
        </Button>
      </form>
    </div>
  );
}


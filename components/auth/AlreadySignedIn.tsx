"use client";

import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { SITE_DARK_INSET } from "@/lib/site/publicPageLayout";
import { cn } from "@/lib/utils";

export function AlreadySignedIn() {
  const t = useTranslations("auth");
  const locale = useLocale();

  return (
    <div className="space-y-4">
      <div className={cn("p-5 text-sm text-muted", SITE_DARK_INSET)}>
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


"use client";

import { useLocale, useTranslations } from "next-intl";

export function AlreadySignedIn() {
  const t = useTranslations("auth");
  const locale = useLocale();

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 text-sm text-white/75">
        {t("alreadySignedIn")}
      </div>
      <form action={`/${locale}/auth/logout`} method="post">
        <button
          type="submit"
          className="w-full rounded-2xl border border-white/[0.14] bg-transparent px-6 py-3 text-sm font-medium text-white/85 hover:bg-white/[0.06]"
        >
          {t("logout")}
        </button>
      </form>
    </div>
  );
}


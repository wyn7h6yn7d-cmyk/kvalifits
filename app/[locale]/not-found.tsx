import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { noindexLocalizedMetadata } from "@/lib/seo/site";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "metadata" });
  return noindexLocalizedMetadata({
    locale,
    title: t("notFoundTitle"),
    description: t("notFoundDescription"),
  });
}

export default async function LocaleNotFound() {
  const t = await getTranslations("errors");

  return (
    <main className="mx-auto max-w-lg px-6 py-24">
      <h1 className="text-2xl font-semibold tracking-tight text-white">{t("notFoundTitle")}</h1>
      <p className="mt-3 text-sm leading-6 text-white/70">{t("notFoundBody")}</p>
      <Button asChild className="mt-8">
        <Link href="/">{t("notFoundHome")}</Link>
      </Button>
    </main>
  );
}

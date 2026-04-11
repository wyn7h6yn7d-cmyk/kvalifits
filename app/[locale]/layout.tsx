import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";

import { LocaleHtml } from "@/components/i18n/LocaleHtml";
import { ScrollToTopButton } from "@/components/ui/ScrollToTopButton";
import { routing, type AppLocale } from "@/i18n/routing";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as AppLocale)) {
    return {};
  }
  const t = await getTranslations({ locale, namespace: "metadata" });
  const ogLocale = locale === "et" ? "et_EE" : locale === "ru" ? "ru_RU" : "en_GB";
  return {
    title: {
      default: t("title"),
      template: "%s · Kvalifits",
    },
    description: t("description"),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        et: "/et",
        en: "/en",
        ru: "/ru",
      },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      type: "website",
      locale: ogLocale,
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as AppLocale)) {
    notFound();
  }
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <LocaleHtml />
      {children}
      <ScrollToTopButton />
    </NextIntlClientProvider>
  );
}

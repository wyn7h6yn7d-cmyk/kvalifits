import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";

import { LocaleHtml } from "@/components/i18n/LocaleHtml";
import { ClipboardPlainCopy } from "@/components/site/ClipboardPlainCopy";
import { ScrollToTopButton } from "@/components/ui/ScrollToTopButton";
import { CookieConsent } from "@/components/cookies/CookieConsent";
import { CurrentAuthProvider } from "@/components/auth/CurrentAuthProvider";
import { getCurrentAuth } from "@/lib/auth/currentAuth";
import { routing, type AppLocale } from "@/i18n/routing";
import { SITE_NAME } from "@/lib/seo/site";

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
  // Canonical / hreflang are set per page (see publicPageMetadata). Layout only
  // provides defaults so nested routes do not inherit the homepage canonical.
  return {
    applicationName: SITE_NAME,
    appleWebApp: {
      title: SITE_NAME,
    },
    title: {
      default: SITE_NAME,
      template: `%s · ${SITE_NAME}`,
    },
    description: t("description"),
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as AppLocale)) {
    notFound();
  }
  setRequestLocale(locale);
  const messages = await getMessages();
  const auth = await getCurrentAuth();

  return (
    <NextIntlClientProvider messages={messages}>
      <CurrentAuthProvider initialAuth={auth}>
        <LocaleHtml />
        <ClipboardPlainCopy />
        {children}
        <CookieConsent />
        <ScrollToTopButton />
      </CurrentAuthProvider>
    </NextIntlClientProvider>
  );
}

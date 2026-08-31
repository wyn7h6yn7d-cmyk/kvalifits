import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { PageHero } from "@/components/site/PageHero";
import { getCurrentAuth } from "@/lib/auth/currentAuth";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return {
    title: t("pricing"),
  };
}

export default async function HinnakiriPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.employers" });

  const auth = await getCurrentAuth();
  if (!auth.authenticated) redirect(`/${locale}/auth/login`);
  if (auth.isBlocked) redirect(`/${locale}/blocked`);
  if (auth.role !== "employer") redirect(`/${locale}/account`);

  return (
    <div className="flex-1 bg-background">
      <Navbar />
      <main className="pt-[var(--site-header-offset)]">
        <PageHero eyebrow={t("heroEyebrow")} title={t("pricingTitle")} subtitle={t("ctaHint")}>
          <div className="max-w-xl">
            <ul className="space-y-2 text-base font-medium text-foreground">
              <li>{t("pricingDuration30")}</li>
              <li>{t("pricingDuration90")}</li>
            </ul>
            <p className="mt-4 text-base leading-[1.65] text-muted">{t("pricingNotChargedYet")}</p>
          </div>
        </PageHero>
      </main>
      <Footer />
    </div>
  );
}


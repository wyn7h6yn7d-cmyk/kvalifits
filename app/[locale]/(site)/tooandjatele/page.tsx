import { UserPlus } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { EmployerProductPreview } from "@/components/employer/EmployerProductPreview";
import { EmployerLandingSteps } from "@/components/sections/employer/EmployerLandingSteps";
import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/routing";
import { getCurrentAuth } from "@/lib/auth/currentAuth";
import { publicPageMetadata } from "@/lib/seo/site";
import {
  SITE_EYEBROW,
  SITE_H2_SECTION,
  SITE_HOME_CTA_PRIMARY,
} from "@/lib/site/publicPageLayout";
import { cn } from "@/lib/utils";

/** Shared left-aligned column — hero, steps, preview, CTA. */
const LANDING_COL = "w-full max-w-5xl";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.employers" });
  return publicPageMetadata({
    locale,
    path: "/tooandjatele",
    title: t("title"),
    description: t("description"),
  });
}

export default async function TooandjatelePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.employers" });

  const { role } = await getCurrentAuth();
  const showPricing = role === "employer";

  const steps = [t("step1"), t("step2"), t("step3"), t("step4")] as const;

  return (
    <div className="bg-background">
      <PageHero
        eyebrow={t("heroEyebrow")}
        title={t("heroTitle")}
        subtitle={t("heroSubtitle")}
        innerClassName={cn("mx-0", LANDING_COL)}
        titleClassName="lg:text-[clamp(3.25rem,4.8vw+1rem,5.25rem)]"
        subtitleClassName="max-w-[42rem] text-[1.125rem] sm:text-[1.1875rem] lg:text-[1.3125rem] lg:leading-[1.62]"
        ctaClassName="mt-5 sm:mt-6 lg:mt-7"
        contentClassName="pb-6 sm:pb-8 lg:pb-10"
        ctaInsideInner
      >
        <Button
          asChild
          variant="primary"
          className={cn(SITE_HOME_CTA_PRIMARY, "w-full sm:w-auto")}
        >
          <Link href="/auth/register?role=employer">
            <UserPlus className="h-4 w-4" />
            {t("ctaAddJob")}
          </Link>
        </Button>
      </PageHero>

      <EmployerLandingSteps steps={steps} contentClassName={LANDING_COL} />

      <EmployerProductPreview contentClassName={LANDING_COL} />

      <section className="bg-background pb-14 sm:pb-16 lg:pb-20">
        <Container>
          <div className={cn(LANDING_COL, "border-t border-white/[0.08] pt-10 sm:pt-12")}>
            <h2 className={SITE_H2_SECTION}>{t("tutorialCtaSectionTitle")}</h2>
            <div className="mt-7">
              <Button
                asChild
                variant="primary"
                className={cn(SITE_HOME_CTA_PRIMARY, "w-full sm:w-auto")}
              >
                <Link href="/auth/register?role=employer">
                  <UserPlus className="h-4 w-4" />
                  {t("ctaAddJob")}
                </Link>
              </Button>
            </div>

            {showPricing ? (
              <div className="mt-10 max-w-xl border-t border-white/[0.08] pt-8">
                <div className={SITE_EYEBROW}>{t("pricingTitle")}</div>
                <ul className="mt-4 space-y-2 text-base font-medium text-foreground">
                  <li>{t("pricingDuration30")}</li>
                  <li>{t("pricingDuration90")}</li>
                </ul>
                <p className="mt-4 text-base leading-[1.65] text-muted">{t("pricingNotChargedYet")}</p>
              </div>
            ) : null}
          </div>
        </Container>
      </section>
    </div>
  );
}

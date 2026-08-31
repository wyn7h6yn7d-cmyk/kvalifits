import { UserPlus } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { EmployerProductPreview } from "@/components/employer/EmployerProductPreview";
import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/routing";
import { getCurrentAuth } from "@/lib/auth/currentAuth";
import { publicPageMetadata } from "@/lib/seo/site";
import {
  SITE_CONTROL_HEIGHT,
  SITE_EYEBROW,
  SITE_SECTION_PB,
  SITE_SECTION_PY,
} from "@/lib/site/publicPageLayout";
import { cn } from "@/lib/utils";

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
    <>
      <PageHero eyebrow={t("heroEyebrow")} title={t("heroTitle")} subtitle={t("heroSubtitle")}>
        <Button
          asChild
          variant="primary"
          className={cn(SITE_CONTROL_HEIGHT, "w-full sm:w-auto")}
        >
          <Link href="/auth/register?role=employer">
            <UserPlus className="h-4 w-4" />
            {t("ctaAddJob")}
          </Link>
        </Button>
      </PageHero>

      <section className={SITE_SECTION_PY}>
        <Container>
          <ol className="mx-auto max-w-3xl list-none space-y-6 sm:space-y-7">
            {steps.map((step, index) => (
              <li key={step} className="flex gap-5 sm:gap-6">
                <span className="mt-0.5 shrink-0 text-[13px] font-medium tabular-nums text-muted-2">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-[1.0625rem] font-medium leading-snug text-foreground">{step}</span>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <EmployerProductPreview />

      <section className={SITE_SECTION_PB}>
        <Container>
          <div className="flex flex-col items-center gap-6 text-center">
            <Button
              asChild
              variant="primary"
              className={cn(SITE_CONTROL_HEIGHT, "w-full sm:w-auto")}
            >
              <Link href="/auth/register?role=employer">
                <UserPlus className="h-4 w-4" />
                {t("ctaAddJob")}
              </Link>
            </Button>

            {showPricing ? (
              <div className="w-full max-w-xl text-left">
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
    </>
  );
}

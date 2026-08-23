import { UserPlus } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { EmployerProductPreview } from "@/components/employer/EmployerProductPreview";
import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/routing";
import { getCurrentAuth } from "@/lib/auth/currentAuth";
import { publicPageMetadata } from "@/lib/seo/site";

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
  const benefits = [t("benefit1"), t("benefit2"), t("benefit3")] as const;

  return (
    <>
      <PageHero ambient={false} eyebrow={t("heroEyebrow")} title={t("heroTitle")} subtitle={t("heroSubtitle")} />

      <section className="py-10 sm:py-16 lg:py-20">
        <Container>
          <ol className="mx-auto max-w-3xl list-none space-y-5 sm:space-y-6">
            {steps.map((step, index) => (
              <li key={step} className="flex gap-4 sm:gap-5">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-sm font-semibold tabular-nums text-white/70"
                  aria-hidden
                >
                  {index + 1}
                </span>
                <span className="pt-0.5 text-[15px] font-medium leading-snug text-white/90 sm:text-base">{step}</span>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <EmployerProductPreview />

      <section className="py-10 sm:py-16 lg:py-20">
        <Container>
          <ul className="mx-auto grid max-w-4xl gap-6 text-center sm:grid-cols-3 sm:gap-8">
            {benefits.map((benefit) => (
              <li key={benefit} className="text-[15px] font-medium leading-snug text-white/85 sm:text-base">
                {benefit}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="pb-12 sm:pb-20 lg:pb-24">
        <Container>
          <div className="flex flex-col items-center gap-6 text-center">
            <Button asChild variant="primary" size="lg" className="h-12 w-full rounded-2xl px-8 sm:w-auto">
              <Link href="/auth/register?role=employer">
                <UserPlus className="h-4 w-4" />
                {t("ctaAddJob")}
              </Link>
            </Button>

            {showPricing ? (
              <div className="w-full max-w-xl text-left">
                <div className="text-[13px] font-medium uppercase tracking-wide text-white/58">{t("pricingTitle")}</div>
                <ul className="mt-4 space-y-2 text-sm font-medium text-white/85">
                  <li>{t("pricingDuration30")}</li>
                  <li>{t("pricingDuration90")}</li>
                </ul>
                <p className="mt-4 text-sm leading-relaxed text-white/55">{t("pricingNotChargedYet")}</p>
              </div>
            ) : null}
          </div>
        </Container>
      </section>
    </>
  );
}

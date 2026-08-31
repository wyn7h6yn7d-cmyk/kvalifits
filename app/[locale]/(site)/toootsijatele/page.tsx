import { UserPlus } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/routing";
import { publicPageMetadata } from "@/lib/seo/site";
import {
  SITE_CONTROL_HEIGHT,
  SITE_EYEBROW,
  SITE_H2_SECTION,
  SITE_SECTION_PB,
  SITE_SECTION_PY,
} from "@/lib/site/publicPageLayout";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.seekers" });
  return publicPageMetadata({
    locale,
    path: "/toootsijatele",
    title: t("title"),
    description: t("description"),
  });
}

export default async function ToootsijatelePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.seekers" });

  const tutorialSteps = [
    { title: t("tutorialStep1Title"), body: t("tutorialStep1Body") },
    { title: t("tutorialStep2Title"), body: t("tutorialStep2Body") },
    { title: t("tutorialStep3Title"), body: t("tutorialStep3Body") },
    { title: t("tutorialStep4Title"), body: t("tutorialStep4Body") },
    { title: t("tutorialStep5Title"), body: t("tutorialStep5Body") },
  ] as const;

  return (
    <>
      <PageHero eyebrow={t("heroEyebrow")} title={t("heroTitle")} subtitle={t("heroSubtitle")}>
        <Button
          asChild
          variant="primary"
          className={cn(SITE_CONTROL_HEIGHT, "w-full sm:w-auto")}
        >
          <Link href="/tood">{t("ctaSearchJobs")}</Link>
        </Button>
      </PageHero>

      <section className={cn(SITE_SECTION_PY, SITE_SECTION_PB)}>
        <Container>
          <div className="mx-auto max-w-3xl">
            <div className={SITE_EYEBROW}>{t("tutorialEyebrow")}</div>
            <h2 className={cn("mt-3", SITE_H2_SECTION)}>{t("tutorialTitle")}</h2>
            <ol className="mt-8 list-none space-y-7 sm:space-y-8">
              {tutorialSteps.map((step, index) => (
                <li key={step.title} className="flex gap-5 sm:gap-6">
                  <span className="mt-0.5 shrink-0 text-[13px] font-medium tabular-nums text-muted-2">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[1.0625rem] font-semibold leading-snug text-foreground">{step.title}</div>
                    <p className="mt-2 text-base leading-[1.65] text-muted">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-10">
              <Button
                asChild
                variant="primary"
                className={cn(SITE_CONTROL_HEIGHT, "w-full sm:w-auto")}
              >
                <Link href="/auth/register?role=seeker">
                  <UserPlus className="h-4 w-4" />
                  {t("tutorialCtaRegister")}
                </Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

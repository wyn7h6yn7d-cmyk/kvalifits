import { UserPlus } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { SeekerLandingSteps } from "@/components/sections/seeker/SeekerLandingSteps";
import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/routing";
import { publicPageMetadata } from "@/lib/seo/site";
import { SITE_HOME_CTA_PRIMARY } from "@/lib/site/publicPageLayout";
import { cn } from "@/lib/utils";

/** Shared left-aligned column for hero, steps, and CTA. */
const LANDING_COL = "w-full max-w-5xl";

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
    <div className="bg-background">
      <PageHero
        eyebrow={t("heroEyebrow")}
        title={t("heroTitle")}
        subtitle={t("heroSubtitle")}
        innerClassName={cn("mx-0", LANDING_COL)}
        titleClassName="lg:text-[clamp(3.25rem,4.8vw+1rem,5.25rem)]"
        subtitleClassName="max-w-[42rem] text-[1.125rem] sm:text-[1.1875rem] lg:text-[1.3125rem] lg:leading-[1.62]"
        contentClassName="pb-6 sm:pb-8 lg:pb-10"
        ctaInsideInner
      >
        <Button asChild variant="primary" className={cn(SITE_HOME_CTA_PRIMARY, "w-full sm:w-auto")}>
          <Link href="/tood">{t("ctaSearchJobs")}</Link>
        </Button>
      </PageHero>

      <SeekerLandingSteps
        eyebrow={t("tutorialEyebrow")}
        title={t("tutorialTitle")}
        steps={tutorialSteps}
        contentClassName={LANDING_COL}
      />

      <section className="bg-background pb-14 sm:pb-16 lg:pb-20">
        <Container>
          <div className={cn(LANDING_COL, "border-t border-white/[0.08] pt-10 sm:pt-12")}>
            <Button asChild variant="primary" className={cn(SITE_HOME_CTA_PRIMARY, "w-full sm:w-auto")}>
              <Link href="/auth/register?role=seeker">
                <UserPlus className="h-4 w-4" />
                {t("tutorialCtaRegister")}
              </Link>
            </Button>
          </div>
        </Container>
      </section>
    </div>
  );
}

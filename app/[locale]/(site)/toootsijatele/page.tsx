import { UserPlus } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { SeekerLandingSteps } from "@/components/sections/seeker/SeekerLandingSteps";
import { EditorialPhotoSlot } from "@/components/site/EditorialPhotoSlot";
import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/routing";
import { publicPageMetadata } from "@/lib/seo/site";
import { SITE_HOME_CTA_PRIMARY } from "@/lib/site/publicPageLayout";
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
  const photoLocale = locale === "en" || locale === "ru" ? locale : "et";

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
        innerClassName="max-w-4xl lg:max-w-5xl xl:max-w-[56rem]"
        titleClassName="lg:text-[clamp(3.25rem,4.8vw+1rem,5.25rem)]"
        subtitleClassName="max-w-[42rem] text-[1.125rem] sm:text-[1.1875rem] lg:text-[1.3125rem] lg:leading-[1.62]"
        contentClassName="pb-6 sm:pb-8 lg:pb-10"
        ctaInsideInner
      >
        <Button asChild variant="primary" className={cn(SITE_HOME_CTA_PRIMARY, "w-full sm:w-auto")}>
          <Link href="/tood">{t("ctaSearchJobs")}</Link>
        </Button>
      </PageHero>

      <section className="bg-background pb-10 sm:pb-14 lg:pb-16">
        <Container>
          <EditorialPhotoSlot
            slotId="landingSeeker"
            locale={photoLocale}
            alt={t("heroPhotoAlt")}
            caption={t("heroPhotoCaption")}
            aspect="16/9"
            className="mx-auto max-w-5xl"
          />
        </Container>
      </section>

      <SeekerLandingSteps eyebrow={t("tutorialEyebrow")} title={t("tutorialTitle")} steps={tutorialSteps} />

      <section className="bg-background pb-14 sm:pb-16 lg:pb-20">
        <Container>
          <div className="mx-auto flex max-w-3xl justify-center border-t border-white/[0.08] px-2 pt-10 sm:pt-12">
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

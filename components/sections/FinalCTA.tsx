import { getTranslations } from "next-intl/server";

import { HomeSectionShell } from "@/components/sections/home/HomeSectionShell";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { SITE_H2_HOME, SITE_HOME_CTA_PRIMARY, SITE_HOME_CTA_SECONDARY } from "@/lib/site/publicPageLayout";
import { cn } from "@/lib/utils";

export async function FinalCTA() {
  const t = await getTranslations("finalCta");

  return (
    <HomeSectionShell
      id="registreeru"
      tone="base"
      contentWidth="cta"
      className="scroll-mt-[var(--site-header-offset)]"
    >
      <div className="relative text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-52 w-[min(100%,26rem)] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.05),transparent_74%)] sm:h-56 sm:w-[min(100%,30rem)] lg:h-60 lg:w-[34rem]"
        />
        <h2 className={cn("relative", SITE_H2_HOME)}>{t("title")}</h2>
        <div className="relative mt-10 flex flex-col gap-4 sm:mt-11 sm:flex-row sm:justify-center lg:mt-12 lg:gap-5">
          <Button asChild variant="primary" size="lg" className={cn(SITE_HOME_CTA_PRIMARY, "w-full min-w-0 sm:w-auto sm:min-w-[13.5rem]")}>
            <Link href="/tood">{t("ctaSeeker")}</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className={cn(SITE_HOME_CTA_SECONDARY, "w-full min-w-0 sm:w-auto sm:min-w-[13.5rem]")}>
            <Link href="/auth/register?role=employer">{t("ctaEmployer")}</Link>
          </Button>
        </div>
      </div>
    </HomeSectionShell>
  );
}

import { getTranslations } from "next-intl/server";

import { HomeSectionShell } from "@/components/sections/home/HomeSectionShell";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { SITE_H2_HOME, SITE_HOME_CTA_PRIMARY, SITE_HOME_CTA_SECONDARY } from "@/lib/site/publicPageLayout";
import { cn } from "@/lib/utils";

export async function FinalCTA() {
  const t = await getTranslations("finalCta");

  return (
    <HomeSectionShell id="registreeru" tone="deep" narrow className="scroll-mt-[var(--site-header-offset)] overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_95%_75%_at_50%_100%,rgba(99,102,241,0.22),transparent_65%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--accent-pink)]/35 to-transparent"
      />
      <div className="relative text-center">
        <div
          aria-hidden
          className="mx-auto mb-6 h-px w-12 bg-gradient-to-r from-violet-400/70 via-[var(--accent-pink)]/50 to-transparent"
        />
        <h2 className={SITE_H2_HOME}>{t("title")}</h2>
        <div className="mt-10 flex flex-col gap-3.5 sm:flex-row sm:justify-center sm:gap-4">
          <Button asChild variant="primary" size="lg" className={cn(SITE_HOME_CTA_PRIMARY, "w-full min-w-0 sm:w-auto sm:min-w-[12rem]")}>
            <Link href="/tood">{t("ctaSeeker")}</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className={cn(SITE_HOME_CTA_SECONDARY, "w-full min-w-0 sm:w-auto sm:min-w-[12rem]")}>
            <Link href="/auth/register?role=employer">{t("ctaEmployer")}</Link>
          </Button>
        </div>
      </div>
    </HomeSectionShell>
  );
}

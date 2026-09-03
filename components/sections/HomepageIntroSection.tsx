import { getTranslations } from "next-intl/server";

import { HomeSectionShell } from "@/components/sections/home/HomeSectionShell";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { SITE_BODY_LEAD, SITE_H2_HOME, SITE_HOME_CTA_PRIMARY } from "@/lib/site/publicPageLayout";
import { cn } from "@/lib/utils";

/**
 * Secondary homepage hero — plain explanation of what Kvalifits is.
 * Sits between search and jobs so the page doesn’t jump straight to listings.
 */
export async function HomepageIntroSection() {
  const t = await getTranslations("homeIntro");

  const steps = [
    { title: t("s1Title"), body: t("s1Body") },
    { title: t("s2Title"), body: t("s2Body") },
    { title: t("s3Title"), body: t("s3Body") },
  ] as const;

  return (
    <HomeSectionShell tone="base" aria-labelledby="home-intro-title" className="pt-14 sm:pt-16 lg:pt-20">
      <div className="w-full max-w-5xl">
        <div className="mb-5 flex items-center gap-3" aria-hidden>
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-pink)]/80" />
          <span className="h-px w-10 bg-white/[0.14]" />
        </div>
        <p className="text-[0.9375rem] font-medium text-muted-2">{t("eyebrow")}</p>
        <h2
          id="home-intro-title"
          className={cn("mt-3 max-w-[22ch] text-pretty sm:max-w-[28ch] lg:max-w-[32ch]", SITE_H2_HOME)}
        >
          {t("title")}
        </h2>
        <p className={cn("mt-5 max-w-[40rem] text-pretty sm:mt-6", SITE_BODY_LEAD)}>{t("lead")}</p>

        <ol className="mt-12 grid list-none gap-8 border-t border-white/[0.08] pt-10 sm:mt-14 sm:grid-cols-3 sm:gap-8 sm:pt-12 lg:mt-16 lg:gap-10">
          {steps.map((step, index) => (
            <li key={step.title} className="min-w-0">
              <span
                aria-hidden
                className="text-[0.8125rem] font-medium tabular-nums tracking-[0.08em] text-[var(--accent-pink)]/80"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 text-[1.125rem] font-semibold leading-snug tracking-[-0.02em] text-foreground sm:text-[1.1875rem] lg:text-[1.25rem]">
                {step.title}
              </h3>
              <p className="mt-2.5 max-w-[22rem] text-pretty text-[0.9875rem] leading-[1.68] text-muted sm:text-base sm:leading-[1.7]">
                {step.body}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-10 sm:mt-12">
          <Button asChild variant="primary" className={cn(SITE_HOME_CTA_PRIMARY, "w-full sm:w-auto")}>
            <Link href="/tood">{t("cta")}</Link>
          </Button>
        </div>
      </div>
    </HomeSectionShell>
  );
}

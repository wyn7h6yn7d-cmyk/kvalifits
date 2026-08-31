import { Briefcase, Building2 } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { HomeSectionHeader } from "@/components/sections/home/HomeSectionHeader";
import { HomeSectionShell } from "@/components/sections/home/HomeSectionShell";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { SITE_BODY, SITE_H3, SITE_HOME_CARD, SITE_HOME_CTA_PRIMARY, SITE_HOME_CTA_SECONDARY } from "@/lib/site/publicPageLayout";
import { cn } from "@/lib/utils";

export async function HomepageAudienceSection() {
  const t = await getTranslations("homeAudience");

  const paths = [
    {
      icon: Briefcase,
      title: t("seekerTitle"),
      desc: t("seekerDesc"),
      cta: t("seekerLink"),
      ctaHref: "/tood",
      primary: true,
    },
    {
      icon: Building2,
      title: t("employerTitle"),
      desc: t("employerDesc"),
      cta: t("employerLink"),
      ctaHref: "/auth/register?role=employer",
      primary: false,
    },
  ] as const;

  return (
    <HomeSectionShell tone="raised" glow="top" aria-labelledby="home-audience-title">
      <HomeSectionHeader title={t("title")} id="home-audience-title" />
      <div className="grid gap-5 sm:grid-cols-2 lg:gap-6">
        {paths.map((path) => {
          const Icon = path.icon;
          return (
            <article
              key={path.ctaHref}
              className={cn(SITE_HOME_CARD, "relative overflow-hidden p-6 sm:p-7")}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.12),transparent_70%)]"
              />
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.12] bg-white/[0.05] text-violet-300">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className={cn("mt-6", SITE_H3)}>{path.title}</h3>
                <p className={cn("mt-3 max-w-sm text-pretty", SITE_BODY, "text-muted")}>{path.desc}</p>
                <div className="mt-6">
                  <Button
                    asChild
                    variant={path.primary ? "primary" : "outline"}
                    size="lg"
                    className={cn(path.primary ? SITE_HOME_CTA_PRIMARY : SITE_HOME_CTA_SECONDARY, "w-full sm:w-auto")}
                  >
                    <Link href={path.ctaHref}>{path.cta}</Link>
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </HomeSectionShell>
  );
}

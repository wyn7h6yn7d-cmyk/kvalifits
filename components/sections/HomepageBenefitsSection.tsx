import { BadgeCheck, ListChecks, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { HomeSectionHeader } from "@/components/sections/home/HomeSectionHeader";
import { HomeSectionShell } from "@/components/sections/home/HomeSectionShell";
import { SITE_BODY, SITE_H3, SITE_HOME_CARD } from "@/lib/site/publicPageLayout";
import { cn } from "@/lib/utils";

export async function HomepageBenefitsSection() {
  const t = await getTranslations("homeBenefits");

  const blocks = [
    { icon: Sparkles, title: t("b1Title"), desc: t("b1Desc") },
    { icon: ListChecks, title: t("b2Title"), desc: t("b2Desc") },
    { icon: BadgeCheck, title: t("b3Title"), desc: t("b3Desc") },
  ] as const;

  return (
    <HomeSectionShell tone="raised" glow="top" aria-labelledby="home-benefits-title">
      <HomeSectionHeader title={t("title")} id="home-benefits-title" />
      <ul className="grid gap-5 sm:grid-cols-3 lg:gap-6">
        {blocks.map((b) => {
          const Icon = b.icon;
          return (
            <li key={b.title} className={cn(SITE_HOME_CARD, "relative overflow-hidden p-6 sm:p-7")}>
              <div
                aria-hidden
                className="absolute left-0 top-0 h-0.5 w-full bg-gradient-to-r from-indigo-400/55 via-violet-400/45 to-[var(--accent-pink)]/45"
              />
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.10] bg-white/[0.04] text-violet-300">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <h3 className={cn("mt-6", SITE_H3)}>{b.title}</h3>
              <p className={cn("mt-3 text-pretty", SITE_BODY, "text-muted")}>{b.desc}</p>
            </li>
          );
        })}
      </ul>
    </HomeSectionShell>
  );
}

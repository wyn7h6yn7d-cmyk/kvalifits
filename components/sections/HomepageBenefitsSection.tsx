import { getTranslations } from "next-intl/server";

import { HomeSectionShell } from "@/components/sections/home/HomeSectionShell";
import { SITE_BODY_LEAD, SITE_H2_HOME } from "@/lib/site/publicPageLayout";
import { cn } from "@/lib/utils";

/**
 * “Miks Kvalifits” — editorial list of three advantages.
 * Open typography + dividers; no SaaS glass-card grid.
 */
export async function HomepageBenefitsSection() {
  const t = await getTranslations("homeBenefits");

  const blocks = [
    { title: t("b1Title"), desc: t("b1Desc") },
    { title: t("b2Title"), desc: t("b2Desc") },
    { title: t("b3Title"), desc: t("b3Desc") },
  ] as const;

  return (
    <HomeSectionShell tone="base" aria-labelledby="home-benefits-title">
      <div className="mx-auto max-w-3xl lg:max-w-4xl">
        <div className="mb-6 flex items-center gap-3" aria-hidden>
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-pink)]/80" />
          <span className="h-px w-10 bg-white/[0.14]" />
        </div>
        <h2 id="home-benefits-title" className={SITE_H2_HOME}>
          {t("title")}
        </h2>
        {t("lead") ? (
          <p className={cn("mt-5 max-w-md text-pretty", SITE_BODY_LEAD)}>{t("lead")}</p>
        ) : null}

        <ol className="mt-14 list-none divide-y divide-white/[0.08] border-y border-white/[0.08] sm:mt-16 lg:mt-20">
          {blocks.map((b, index) => (
            <li
              key={b.title}
              className="grid gap-5 py-10 sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:items-start sm:gap-10 sm:py-12 lg:grid-cols-[6.5rem_minmax(0,14rem)_minmax(0,1fr)] lg:gap-14 lg:py-14"
            >
              <span
                aria-hidden
                className="font-semibold tabular-nums tracking-[-0.06em] text-white/[0.14] text-[2.75rem] leading-none sm:text-[3.25rem] lg:text-[3.75rem]"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="max-w-[14rem] text-[1.25rem] font-semibold leading-snug tracking-[-0.02em] text-foreground sm:text-[1.375rem] lg:text-[1.5rem]">
                {b.title}
              </h3>
              <p
                className={cn(
                  "max-w-md text-pretty sm:col-span-2 lg:col-span-1 lg:pt-1",
                  SITE_BODY_LEAD,
                  "text-[1rem] text-muted lg:text-[1.0625rem]",
                )}
              >
                {b.desc}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </HomeSectionShell>
  );
}

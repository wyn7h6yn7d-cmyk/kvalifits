import { Check, Circle } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { HomeSectionShell } from "@/components/sections/home/HomeSectionShell";
import { SITE_BODY_LEAD, SITE_H2_HOME } from "@/lib/site/publicPageLayout";
import { cn } from "@/lib/utils";

/**
 * Minimal match hint on the homepage — score + short reasons only.
 * Full product demos belong on seeker/employer landing pages.
 */
export async function HomepageMatchDemoSection() {
  const t = await getTranslations("homeMatchDemo");

  const reasons = [
    { status: "match" as const, text: t("reason1") },
    { status: "match" as const, text: t("reason2") },
    { status: "match" as const, text: t("reason3") },
    { status: "partial" as const, text: t("reason4") },
  ];

  return (
    <HomeSectionShell tone="base" contentWidth="cta" aria-labelledby="home-match-demo-title">
      <div className="mx-auto max-w-md text-center sm:max-w-lg">
        <div className="mb-5 flex items-center justify-center gap-3" aria-hidden>
          <span className="h-px w-8 bg-white/[0.12]" />
          <span className="h-1 w-1 rounded-full bg-[var(--accent-pink)]/70" />
          <span className="h-px w-8 bg-white/[0.12]" />
        </div>
        <h2 id="home-match-demo-title" className={SITE_H2_HOME}>
          {t("title")}
        </h2>
        <p className={cn("mx-auto mt-4 max-w-sm text-pretty", SITE_BODY_LEAD)}>{t("lead")}</p>

        <div className="mt-10 rounded-2xl border border-white/[0.08] bg-[#12121a]/80 px-6 py-8 text-left sm:mt-11 sm:px-8 sm:py-9">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-[2.25rem] font-semibold tabular-nums tracking-[-0.04em] text-foreground sm:text-[2.5rem]">
              {t("matchScore")}
            </span>
            <span className="text-[1rem] font-medium text-muted">{t("matchLabel")}</span>
          </div>
          <p className="mt-2 text-[0.9375rem] text-muted-2 sm:text-base">{t("reqsFilled")}</p>

          <ul className="mt-7 space-y-3 border-t border-white/[0.07] pt-6">
            {reasons.map((reason) => (
              <li key={reason.text} className="flex min-w-0 items-start gap-2.5 text-[0.9375rem] leading-snug text-body sm:text-base">
                {reason.status === "match" ? (
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center text-emerald-400/90">
                    <Check className="h-3.5 w-3.5" strokeWidth={2.75} aria-hidden />
                  </span>
                ) : (
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center text-white/35">
                    <Circle className="h-3 w-3" strokeWidth={2} aria-hidden />
                  </span>
                )}
                <span className="min-w-0 text-pretty">{reason.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </HomeSectionShell>
  );
}

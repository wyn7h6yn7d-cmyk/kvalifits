"use client";

import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  getEmployerFeaturedDisplayState,
  type JobFeaturedFields,
} from "@/lib/jobs/jobFeatured";
import { formatJobDateDdMmYyyy } from "@/lib/jobs/jobLifecycle";

type Props = {
  locale: string;
  job: JobFeaturedFields & { status?: string | null };
  compact?: boolean;
};

function formatFeaturedUntil(raw: string, locale: string): string {
  const formatted = formatJobDateDdMmYyyy(raw);
  if (formatted) return formatted;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  const tag = locale === "en" ? "en-GB" : locale === "ru" ? "ru-RU" : "et-EE";
  return d.toLocaleDateString(tag, { year: "numeric", month: "2-digit", day: "2-digit" });
}

export function EmployerJobFeaturedPromo({ locale, job, compact = false }: Props) {
  const t = useTranslations("jobs");
  const [sheetOpen, setSheetOpen] = useState(false);

  const display = useMemo(() => getEmployerFeaturedDisplayState(job), [job]);
  const untilFormatted =
    display.kind === "active" ? formatFeaturedUntil(display.until, locale) : null;

  if ((job.status ?? "").toString() !== "published") return null;

  if (compact) {
    if (display.kind !== "active" || !untilFormatted) return null;
    return (
      <div className="mt-1 text-xs text-violet-200/85">
        {t("featuredStatusActive", { date: untilFormatted })}
      </div>
    );
  }

  return (
    <>
      <section className="rounded-2xl border border-violet-400/20 bg-violet-500/[0.06] px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex items-start gap-3">
          <div
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-300/20 bg-violet-500/10 text-violet-200"
            aria-hidden
          >
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-white">{t("featuredPromoTitle")}</h2>
              <p className="mt-1 text-sm leading-relaxed text-white/65">{t("featuredPromoDescription")}</p>
            </div>

            <div
              className={
                display.kind === "active"
                  ? "inline-flex rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-100"
                  : "inline-flex rounded-full border border-white/[0.10] bg-white/[0.04] px-3 py-1 text-xs font-medium text-white/60"
              }
            >
              {display.kind === "active" && untilFormatted
                ? t("featuredStatusActive", { date: untilFormatted })
                : t("featuredStatusInactive")}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/[0.08] bg-black/20 px-3 py-3">
                <div className="text-[11px] font-medium uppercase tracking-wide text-white/45">
                  {t("featuredListingPriceLabel")}
                </div>
                <div className="mt-1 text-sm font-medium text-white/85">{t("featuredListingPrice")}</div>
              </div>
              <div className="rounded-xl border border-violet-300/15 bg-violet-500/[0.08] px-3 py-3">
                <div className="text-[11px] font-medium uppercase tracking-wide text-violet-200/55">
                  {t("featuredAddonPriceLabel")}
                </div>
                <div className="mt-1 text-sm font-medium text-white/90">{t("featuredAddonPrice")}</div>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-white/45">{t("featuredPricingNote")}</p>

            {display.kind === "inactive" ? (
              <Button type="button" variant="primary" size="sm" onClick={() => setSheetOpen(true)}>
                {t("featuredPromoCta")}
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="gap-0">
          <div className="space-y-5 pr-8 pt-1">
            <div>
              <SheetTitle>{t("featuredSheetTitle")}</SheetTitle>
              <SheetDescription className="mt-2">{t("featuredSheetLead")}</SheetDescription>
            </div>

            <p className="text-sm leading-relaxed text-white/70">{t("featuredSheetPricingLead")}</p>

            <div className="space-y-3">
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
                <div className="text-[11px] font-medium uppercase tracking-wide text-white/45">
                  {t("featuredListingPriceLabel")}
                </div>
                <div className="mt-1 text-sm font-medium text-white/85">{t("featuredListingPrice")}</div>
              </div>
              <div className="rounded-xl border border-violet-300/15 bg-violet-500/[0.08] px-4 py-3">
                <div className="text-[11px] font-medium uppercase tracking-wide text-violet-200/55">
                  {t("featuredAddonPriceLabel")}
                </div>
                <div className="mt-1 text-sm font-medium text-white/90">{t("featuredAddonPrice")}</div>
              </div>
            </div>

            <p className="rounded-xl border border-amber-400/20 bg-amber-500/[0.08] px-4 py-3 text-sm leading-relaxed text-amber-50/90">
              {t("featuredSheetNotAvailableYet")}
            </p>

            <p className="text-xs leading-relaxed text-white/45">{t("featuredPricingNote")}</p>

            <Button type="button" variant="outline" size="lg" className="w-full" onClick={() => setSheetOpen(false)}>
              {t("featuredSheetClose")}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";

import { HomeSectionShell } from "@/components/sections/home/HomeSectionShell";
import {
  getMarketingPhotoSrc,
  MARKETING_PROFESSION_LABELS,
} from "@/lib/site/marketingPhotos";
import { SITE_BODY_LEAD, SITE_H2_HOME } from "@/lib/site/publicPageLayout";
import { cn } from "@/lib/utils";

/**
 * “Kvalifits päriselus” — large human photo + short seeker message.
 * Match chip is a quiet accent, not a product demo.
 */
export async function HomepageRealLifeSection() {
  const t = await getTranslations("homeRealLife");
  const locale = await getLocale();
  const photoLocale = locale === "en" || locale === "ru" ? locale : "et";
  const src = getMarketingPhotoSrc("realLife");
  const professionLabel = MARKETING_PROFESSION_LABELS.electrician_technician[photoLocale];

  return (
    <HomeSectionShell tone="base" aria-labelledby="home-real-life-title">
      <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12 xl:gap-16">
        <div className="relative lg:col-span-7">
          <figure className="relative mx-auto max-w-xl lg:mx-0 lg:max-w-none">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[1.35rem] sm:aspect-[5/6] lg:aspect-[4/5] xl:aspect-[5/6]">
              {src ? (
                <Image
                  src={src}
                  alt={t("photoAlt")}
                  fill
                  sizes="(max-width: 1024px) 92vw, 58vw"
                  className="object-cover object-[center_30%]"
                />
              ) : (
                <div className="absolute inset-0 bg-[#101018]">
                  <div className="absolute inset-0 flex flex-col justify-end gap-2 p-6">
                    <p className="text-[0.75rem] font-medium uppercase tracking-[0.08em] text-white/35">
                      {professionLabel}
                    </p>
                    <p className="max-w-[18rem] text-[0.875rem] text-white/45">{t("photoAlt")}</p>
                  </div>
                </div>
              )}

              {/* Soft brand light + edge fade so the photo sits in the dark canvas */}
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-[#07070c]/80 via-transparent to-[#07070c]/25"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-r from-[#07070c]/35 via-transparent to-transparent max-lg:hidden"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -left-6 bottom-16 h-36 w-36 rounded-full bg-indigo-500/[0.14] blur-3xl"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute right-4 top-10 h-28 w-28 rounded-full bg-[var(--accent-pink)]/[0.10] blur-3xl"
              />

              {/* Tiny match accent — supports the human story, does not dominate */}
              <div className="absolute bottom-5 left-5 right-5 sm:bottom-6 sm:left-6 sm:right-auto">
                <div
                  className={cn(
                    "inline-flex max-w-full flex-col gap-1 rounded-2xl border border-white/[0.12]",
                    "bg-[#0c0c14]/78 px-4 py-3 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.9)] backdrop-blur-md",
                    "sm:px-5 sm:py-3.5",
                  )}
                >
                  <div className="flex items-baseline gap-2">
                    <span className="text-[1.25rem] font-semibold tabular-nums tracking-[-0.03em] text-white sm:text-[1.375rem]">
                      {t("matchScore")}
                    </span>
                    <span className="text-[0.8125rem] font-medium text-white/70">{t("matchLabel")}</span>
                  </div>
                  <p className="text-[0.8125rem] leading-snug text-white/55">{t("reqsFilled")}</p>
                </div>
              </div>
            </div>
            <figcaption className="mt-3 text-[0.875rem] leading-snug text-muted-2">
              {t("photoCaption")}
            </figcaption>
          </figure>
        </div>

        <div className="lg:col-span-5">
          <div className="mb-5 flex items-center gap-3" aria-hidden>
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-pink)]/80" />
            <span className="h-px w-10 bg-white/[0.14]" />
          </div>
          <p className="text-[0.9375rem] font-medium text-muted-2">{t("eyebrow")}</p>
          <h2 id="home-real-life-title" className={cn("mt-3 max-w-[16ch] sm:max-w-none", SITE_H2_HOME)}>
            {t("title")}
          </h2>
          <p className={cn("mt-5 max-w-md text-pretty", SITE_BODY_LEAD)}>{t("lead")}</p>
        </div>
      </div>
    </HomeSectionShell>
  );
}

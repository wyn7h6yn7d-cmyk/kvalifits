import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { HomeSectionShell } from "@/components/sections/home/HomeSectionShell";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { getMarketingPhotoSrc } from "@/lib/site/marketingPhotos";
import {
  SITE_BODY_LEAD,
  SITE_HOME_CTA_PRIMARY,
  SITE_HOME_CTA_SECONDARY,
} from "@/lib/site/publicPageLayout";
import { cn } from "@/lib/utils";

/**
 * Seeker / employer split — real photos + short copy + one CTA each.
 * No icon cards, no secondary feature chrome.
 */
export async function HomepageAudienceSection() {
  const t = await getTranslations("homeAudience");
  const seekerSrc = getMarketingPhotoSrc("audienceSeeker");
  const employerSrc = getMarketingPhotoSrc("audienceEmployer");

  const paths = [
    {
      key: "seeker" as const,
      title: t("seekerTitle"),
      desc: t("seekerDesc"),
      cta: t("seekerLink"),
      ctaHref: "/tood" as const,
      photoAlt: t("seekerPhotoAlt"),
      src: seekerSrc,
      primary: true,
    },
    {
      key: "employer" as const,
      title: t("employerTitle"),
      desc: t("employerDesc"),
      cta: t("employerLink"),
      ctaHref: "/auth/register?role=employer" as const,
      photoAlt: t("employerPhotoAlt"),
      src: employerSrc,
      primary: false,
    },
  ] as const;

  return (
    <HomeSectionShell tone="base" aria-labelledby="home-audience-title">
      <h2 id="home-audience-title" className="sr-only">
        {t("title")}
      </h2>

      <div className="grid gap-12 sm:gap-14 lg:grid-cols-2 lg:gap-10 xl:gap-14">
        {paths.map((path) => (
          <article key={path.key} className="flex min-w-0 flex-col">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[1.25rem] sm:aspect-[5/6]">
              {path.src ? (
                <Image
                  src={path.src}
                  alt={path.photoAlt}
                  fill
                  sizes="(max-width: 1024px) 92vw, 44vw"
                  className={cn(
                    "object-cover",
                    path.key === "seeker" ? "object-[center_20%]" : "object-[center_22%]",
                  )}
                />
              ) : (
                <div className="absolute inset-0 bg-[#101018]" />
              )}
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-[#07070c]/55 via-transparent to-[#07070c]/15"
              />
            </div>

            <div className="mt-7 flex flex-1 flex-col sm:mt-8">
              <h3 className="text-[1.5rem] font-semibold tracking-[-0.025em] text-foreground sm:text-[1.625rem] lg:text-[1.75rem]">
                {path.title}
              </h3>
              <p className={cn("mt-3 max-w-sm text-pretty", SITE_BODY_LEAD)}>{path.desc}</p>
              <div className="mt-7 sm:mt-8">
                <Button
                  asChild
                  variant={path.primary ? "primary" : "outline"}
                  size="lg"
                  className={cn(
                    path.primary ? SITE_HOME_CTA_PRIMARY : SITE_HOME_CTA_SECONDARY,
                    "w-full sm:w-auto",
                  )}
                >
                  <Link href={path.ctaHref}>{path.cta}</Link>
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </HomeSectionShell>
  );
}

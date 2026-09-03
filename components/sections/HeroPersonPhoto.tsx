import Image from "next/image";

import { getMarketingPhotoSrc, getMarketingPhotoSlot } from "@/lib/site/marketingPhotos";
import { cn } from "@/lib/utils";

/**
 * Hero supporting visual — soft-masked workplace photo + small match card.
 * When `supporting`, keeps a quieter ~30% presence (not a 50/50 photo hero).
 */
export function HeroPersonPhoto({
  alt,
  priority = false,
  className,
  matchScore,
  matchLabel,
  matchReqs,
  supporting = false,
}: {
  alt: string;
  priority?: boolean;
  className?: string;
  matchScore?: string;
  matchLabel?: string;
  matchReqs?: string;
  supporting?: boolean;
}) {
  const src = getMarketingPhotoSrc("heroPerson");
  const slot = getMarketingPhotoSlot("heroPerson");
  const showMatch = Boolean(matchScore && matchLabel);

  return (
    <div className={cn("relative isolate kf-hero-photo-enter", className)}>
      <div
        className={cn(
          "relative w-full overflow-hidden",
          supporting
            ? "aspect-[3/4] sm:aspect-[4/5] lg:aspect-[3/4] xl:aspect-[4/5]"
            : "aspect-[4/5] sm:aspect-[5/6] lg:aspect-[4/5]",
          /* Soft silhouette — supporting, not a hard media card */
          "lg:[-webkit-mask-image:linear-gradient(to_right,transparent_0%,#000_14%,#000_100%),linear-gradient(to_bottom,#000_0%,#000_82%,transparent_100%)]",
          "lg:[-webkit-mask-composite:source-in]",
          "lg:[mask-image:linear-gradient(to_right,transparent_0%,#000_14%,#000_100%),linear-gradient(to_bottom,#000_0%,#000_82%,transparent_100%)]",
          "lg:[mask-composite:intersect]",
        )}
      >
        {src ? (
          <Image
            src={src}
            alt={alt}
            fill
            priority={priority}
            sizes={supporting ? "(max-width: 1024px) 60vw, 28vw" : "(max-width: 1024px) 88vw, 44vw"}
            className="object-cover object-[center_16%]"
          />
        ) : (
          <div className="absolute inset-0 bg-[#101018]">
            <div className="absolute inset-0 flex flex-col justify-end gap-2 p-5">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-pink)]/80" aria-hidden />
              <p className="max-w-[14rem] text-[0.8125rem] leading-snug text-white/45">{alt}</p>
              <p className="max-w-[16rem] text-[0.75rem] leading-snug text-white/28">{slot.brief}</p>
            </div>
          </div>
        )}

        <div
          aria-hidden
          className="pointer-events-none absolute -left-[12%] bottom-[10%] h-[34%] w-[40%] rounded-full bg-indigo-500/[0.10] blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-[8%] top-[16%] h-[24%] w-[30%] rounded-full bg-[var(--accent-pink)]/[0.06] blur-3xl"
        />

        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-[#07070c]/80 via-transparent to-[#07070c]/30 lg:from-[#07070c]/40 lg:to-transparent"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-[#07070c]/50 via-transparent to-transparent lg:from-[#07070c]/25"
        />

        {showMatch ? (
          <div className="kf-hero-match-enter absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-auto">
            <div
              className={cn(
                "inline-flex max-w-full flex-col gap-0.5 rounded-xl border border-white/[0.12]",
                "bg-[#0c0c14]/80 px-3.5 py-2.5 shadow-[0_14px_36px_-28px_rgba(0,0,0,0.9)] backdrop-blur-md",
                "sm:rounded-2xl sm:px-4 sm:py-3",
              )}
            >
              <div className="flex items-baseline gap-1.5 sm:gap-2">
                <span className="text-[1.125rem] font-semibold tabular-nums tracking-[-0.03em] text-white sm:text-[1.25rem]">
                  {matchScore}
                </span>
                <span className="text-[0.75rem] font-medium text-white/70 sm:text-[0.8125rem]">{matchLabel}</span>
              </div>
              {matchReqs ? (
                <p className="text-[0.75rem] leading-snug text-white/55 sm:text-[0.8125rem]">{matchReqs}</p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

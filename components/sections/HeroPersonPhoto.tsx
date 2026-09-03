import Image from "next/image";

import { getMarketingPhotoSrc, getMarketingPhotoSlot } from "@/lib/site/marketingPhotos";
import { cn } from "@/lib/utils";

/**
 * Hero human photo — soft-masked into the dark canvas (no hard card).
 * One small match overlay as proof, not a product demo.
 */
export function HeroPersonPhoto({
  alt,
  priority = false,
  className,
  matchScore,
  matchLabel,
  matchReqs,
}: {
  alt: string;
  priority?: boolean;
  className?: string;
  matchScore?: string;
  matchLabel?: string;
  matchReqs?: string;
}) {
  const src = getMarketingPhotoSrc("heroPerson");
  const slot = getMarketingPhotoSlot("heroPerson");
  const showMatch = Boolean(matchScore && matchLabel);

  return (
    <div className={cn("relative isolate kf-hero-photo-enter", className)}>
      <div
        className={cn(
          "relative aspect-[4/5] w-full overflow-hidden sm:aspect-[5/6] lg:aspect-[4/5]",
          /* Soft silhouette into the canvas — not a sharp media card */
          "lg:[-webkit-mask-image:linear-gradient(to_right,transparent_0%,#000_10%,#000_100%),linear-gradient(to_bottom,#000_0%,#000_78%,transparent_100%)]",
          "lg:[-webkit-mask-composite:source-in]",
          "lg:[mask-image:linear-gradient(to_right,transparent_0%,#000_10%,#000_100%),linear-gradient(to_bottom,#000_0%,#000_78%,transparent_100%)]",
          "lg:[mask-composite:intersect]",
        )}
      >
        {src ? (
          <Image
            src={src}
            alt={alt}
            fill
            priority={priority}
            sizes="(max-width: 1024px) 88vw, 44vw"
            className="object-cover object-[center_16%]"
          />
        ) : (
          <div className="absolute inset-0 bg-[#101018]">
            <div className="absolute inset-0 flex flex-col justify-end gap-2 p-6">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-pink)]/80" aria-hidden />
              <p className="max-w-[16rem] text-[0.8125rem] leading-snug text-white/45">{alt}</p>
              <p className="max-w-[18rem] text-[0.75rem] leading-snug text-white/28">{slot.brief}</p>
            </div>
          </div>
        )}

        {/* Soft brand light — barely there */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-[10%] bottom-[12%] h-[38%] w-[42%] rounded-full bg-indigo-500/[0.12] blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-[6%] top-[18%] h-[28%] w-[32%] rounded-full bg-[var(--accent-pink)]/[0.07] blur-3xl"
        />

        {/* Edge fades for mobile (desktop uses mask) */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-[#07070c]/75 via-transparent to-[#07070c]/25 lg:from-[#07070c]/35 lg:to-transparent"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-[#07070c]/40 via-transparent to-transparent lg:from-[#07070c]/20"
        />

        {showMatch ? (
          <div className="kf-hero-match-enter absolute bottom-4 left-4 right-4 sm:bottom-5 sm:left-5 sm:right-auto">
            <div
              className={cn(
                "inline-flex max-w-full flex-col gap-0.5 rounded-2xl border border-white/[0.12]",
                "bg-[#0c0c14]/78 px-4 py-3 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.9)] backdrop-blur-md",
                "sm:px-5 sm:py-3.5",
              )}
            >
              <div className="flex items-baseline gap-2">
                <span className="text-[1.25rem] font-semibold tabular-nums tracking-[-0.03em] text-white sm:text-[1.375rem]">
                  {matchScore}
                </span>
                <span className="text-[0.8125rem] font-medium text-white/70">{matchLabel}</span>
              </div>
              {matchReqs ? (
                <p className="text-[0.8125rem] leading-snug text-white/55">{matchReqs}</p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

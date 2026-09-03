import Image from "next/image";

import { getMarketingPhotoSrc, getMarketingPhotoSlot } from "@/lib/site/marketingPhotos";
import { cn } from "@/lib/utils";

/**
 * Hero person photo — soft-masked into the dark canvas (no card chrome).
 * Uses catalog slot `heroPerson` only when status is `filled`.
 */
export function HeroPersonPhoto({
  alt,
  priority = false,
  className,
}: {
  alt: string;
  priority?: boolean;
  className?: string;
}) {
  const src = getMarketingPhotoSrc("heroPerson");
  const slot = getMarketingPhotoSlot("heroPerson");

  return (
    <div className={cn("relative isolate", className)}>
      <div className="relative aspect-[4/5] w-full overflow-hidden sm:aspect-[5/6] lg:aspect-[4/5]">
        {src ? (
          <Image
            src={src}
            alt={alt}
            fill
            priority={priority}
            sizes="(max-width: 1024px) 92vw, 42vw"
            className="object-cover object-[center_18%] scale-[1.02]"
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

        {/*
          Edge fades only — no color glow over the face.
          Keep the person opaque in the center so backdrop tech cannot show through.
        */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-[#07070c] via-[#07070c]/40 to-transparent lg:from-[#07070c]/95 lg:via-[#07070c]/28 lg:to-transparent"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-[#07070c] via-[#07070c]/18 to-[#07070c]/50"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-l from-[#07070c]/50 via-transparent to-transparent max-lg:hidden"
        />
        {/* Soft vignette at edges; center (face) stays clear of tech bleed */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_58%_36%,transparent_0%,transparent_48%,rgba(7,7,12,0.28)_78%,rgba(7,7,12,0.78)_100%)]"
        />
      </div>
    </div>
  );
}

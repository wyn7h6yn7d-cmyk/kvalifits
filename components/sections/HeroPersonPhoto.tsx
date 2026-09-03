import Image from "next/image";

import { getMarketingPhotoSrc, getMarketingPhotoSlot } from "@/lib/site/marketingPhotos";
import { cn } from "@/lib/utils";

/**
 * Hero person photo — soft-masked into the dark canvas (no card chrome).
 * Right half of the homepage hero split.
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
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[1.25rem] sm:aspect-[5/6] lg:aspect-[4/5] lg:rounded-[1.35rem]">
        {src ? (
          <Image
            src={src}
            alt={alt}
            fill
            priority={priority}
            sizes="(max-width: 1024px) 92vw, 42vw"
            className="object-cover object-[center_18%]"
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

        {/* Soft edge blend into dark hero — face stays clear */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-[#07070c]/55 via-transparent to-transparent lg:from-[#07070c]/35"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-[#07070c]/70 via-transparent to-[#07070c]/20"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_55%_35%,transparent_0%,transparent_52%,rgba(7,7,12,0.25)_82%,rgba(7,7,12,0.55)_100%)]"
        />
      </div>
    </div>
  );
}

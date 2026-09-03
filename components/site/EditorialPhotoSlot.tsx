import Image from "next/image";

import {
  getMarketingPhotoSlot,
  getMarketingPhotoSrc,
  MARKETING_PROFESSION_LABELS,
  type MarketingSlotId,
} from "@/lib/site/marketingPhotos";
import { cn } from "@/lib/utils";

type Aspect = "4/5" | "3/4" | "16/10" | "16/9" | "1/1";

const ASPECT_CLASS: Record<Aspect, string> = {
  "4/5": "aspect-[4/5]",
  "3/4": "aspect-[3/4]",
  "16/10": "aspect-[16/10]",
  "16/9": "aspect-[16/9]",
  "1/1": "aspect-square",
};

/**
 * Editorial photo frame wired to the Human Premium catalog.
 * Renders the licensed file when the slot is `filled`; otherwise a quiet documented placeholder.
 */
export function EditorialPhotoSlot({
  slotId,
  alt,
  caption,
  aspect = "4/5",
  priority = false,
  className,
  frameClassName,
  locale = "et",
}: {
  slotId: MarketingSlotId;
  alt: string;
  caption?: string;
  aspect?: Aspect;
  priority?: boolean;
  className?: string;
  frameClassName?: string;
  locale?: "et" | "en" | "ru";
}) {
  const slot = getMarketingPhotoSlot(slotId);
  const src = getMarketingPhotoSrc(slotId);
  const professionLabel = MARKETING_PROFESSION_LABELS[slot.profession][locale];

  return (
    <figure className={cn("min-w-0", className)}>
      <div
        className={cn(
          "relative overflow-hidden rounded-[1.25rem] border border-white/[0.09] bg-[#101018]",
          "shadow-[0_28px_64px_-48px_rgba(0,0,0,0.9)]",
          ASPECT_CLASS[aspect],
          frameClassName,
        )}
      >
        {src ? (
          <Image
            src={src}
            alt={alt}
            fill
            priority={priority}
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1024px"
            className="object-cover object-[center_28%]"
          />
        ) : (
          <>
            <div
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(99,102,241,0.16),transparent_55%),radial-gradient(ellipse_at_80%_85%,rgba(168,85,247,0.10),transparent_50%),linear-gradient(165deg,#12121a_0%,#0c0c14_100%)]"
            />
            <div
              aria-hidden
              className="absolute inset-0 opacity-[0.35]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
                backgroundSize: "28px 28px",
              }}
            />
            <div className="absolute inset-0 flex flex-col items-start justify-end gap-2 p-5 sm:p-6 lg:p-7">
              <span
                aria-hidden
                className="h-1.5 w-1.5 rounded-full bg-[var(--accent-pink)] shadow-[0_0_12px_rgba(227,31,141,0.45)]"
              />
              <p className="text-[0.75rem] font-medium uppercase tracking-[0.08em] text-white/35">
                {professionLabel}
              </p>
              <p className="max-w-[18rem] text-[0.8125rem] leading-snug text-white/48 sm:text-[0.875rem]">
                {alt}
              </p>
              <p className="max-w-[20rem] text-[0.75rem] leading-snug text-white/28">
                {slot.brief}
              </p>
            </div>
          </>
        )}
      </div>
      {caption ? (
        <figcaption className="mt-3 max-w-[40rem] text-[0.875rem] leading-snug text-muted-2 sm:mt-3.5 sm:text-[0.9375rem]">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

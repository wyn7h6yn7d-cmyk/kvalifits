import Image from "next/image";
import { Check, Circle } from "lucide-react";

import { getMarketingPhotoSrc } from "@/lib/site/marketingPhotos";
import { cn } from "@/lib/utils";

type Reason = {
  status: "match" | "partial";
  text: string;
};

/**
 * Supporting visual + match card.
 * Mobile order: match card → human visual.
 * Desktop (lg+): soft visual with compact match card below/overlapping.
 */
export function HeroMatchPanel({
  photoAlt,
  priority = false,
  score,
  scoreLabel,
  reqsFilled,
  whyTitle,
  reasons,
  className,
}: {
  photoAlt: string;
  priority?: boolean;
  score: string;
  scoreLabel: string;
  reqsFilled: string;
  whyTitle: string;
  reasons: readonly Reason[];
  className?: string;
}) {
  const src = getMarketingPhotoSrc("heroPerson");

  const matchCard = (
    <aside
      className={cn(
        "kf-hero-match-enter relative z-[1] w-full",
        "rounded-2xl border border-white/[0.10] bg-[#0c0c14]/92 px-4 py-3.5",
        "shadow-[0_16px_36px_-28px_rgba(0,0,0,0.9)]",
        "sm:px-4 sm:py-4",
        /* Desktop: overlap soft visual slightly */
        "lg:-mt-11",
      )}
      aria-label={`${score} ${scoreLabel}`}
    >
      <p className="text-[1.25rem] font-semibold tabular-nums leading-none tracking-[-0.03em] text-white sm:text-[1.375rem]">
        {score}{" "}
        <span className="text-[0.9375rem] font-medium tracking-normal text-white/65">{scoreLabel}</span>
      </p>
      <p className="mt-1.5 text-[0.8125rem] leading-snug text-white/55 sm:text-[0.875rem]">{reqsFilled}</p>

      <p className="mt-3 text-[0.75rem] font-medium text-white/38">{whyTitle}</p>
      <ul className="mt-1.5 space-y-1.5">
        {reasons.map((reason) => (
          <li
            key={reason.text}
            className="flex min-w-0 items-start gap-2 text-[0.8125rem] leading-snug text-white/75 sm:text-[0.875rem]"
          >
            {reason.status === "match" ? (
              <span className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center text-emerald-400/85">
                <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden />
              </span>
            ) : (
              <span className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center text-white/30">
                <Circle className="h-2.5 w-2.5" strokeWidth={2} aria-hidden />
              </span>
            )}
            <span className="min-w-0 text-pretty">{reason.text}</span>
          </li>
        ))}
      </ul>
    </aside>
  );

  const visual = (
    <div
      className={cn(
        "relative w-full overflow-hidden",
        /* Compact on phone — visible but not towering */
        "h-[11.5rem] sm:h-[13.5rem] lg:h-auto lg:aspect-[3/4]",
        "lg:[-webkit-mask-image:radial-gradient(ellipse_82%_78%_at_58%_38%,#000_18%,transparent_76%),linear-gradient(to_left,#000_40%,transparent_100%),linear-gradient(to_top,#000_55%,transparent_100%)]",
        "lg:[-webkit-mask-composite:source-in]",
        "lg:[mask-image:radial-gradient(ellipse_82%_78%_at_58%_38%,#000_18%,transparent_76%),linear-gradient(to_left,#000_40%,transparent_100%),linear-gradient(to_top,#000_55%,transparent_100%)]",
        "lg:[mask-composite:intersect]",
        /* Soft rounded crop on mobile only */
        "rounded-2xl lg:rounded-none",
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={photoAlt}
          fill
          priority={priority}
          sizes="(max-width: 1024px) 100vw, 28vw"
          className="object-cover object-[center_18%] opacity-[0.92] lg:opacity-[0.9]"
        />
      ) : (
        <div className="absolute inset-0 bg-[#101018]" aria-hidden />
      )}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_65%_30%,rgba(99,102,241,0.07),transparent_52%)]"
      />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#07070c]/70 via-transparent to-[#07070c]/20 lg:from-[#07070c]/85" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-[#07070c]/35 via-transparent to-transparent lg:from-[#07070c]/55" />
    </div>
  );

  return (
    <div className={cn("relative isolate kf-hero-photo-enter min-w-0", className)}>
      {/*
        Mobile: flex-col-reverse → card then visual.
        Desktop: flex-col → visual then card.
      */}
      <div className="flex flex-col-reverse gap-4 sm:gap-5 lg:flex-col lg:gap-0">
        {visual}
        {matchCard}
      </div>
    </div>
  );
}

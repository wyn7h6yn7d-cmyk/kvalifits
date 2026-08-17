"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import type { PortalIntensity } from "./portal-tokens";
import { portalDurationScale, portalLayerOpacity } from "./portal-tokens";

/**
 * Variant B: abstraktsed kaardi-outline’id + “kontrollitud” markerid.
 * CSS-only motion so this chunk does not pull Framer Motion.
 */
export function PortalBackgroundVariantB({
  intensity = "default",
  className,
}: {
  intensity?: PortalIntensity;
  className?: string;
}) {
  const t = useTranslations("portalDecor");
  const opacity = portalLayerOpacity(intensity);
  const dur = portalDurationScale(intensity);

  const cards = [
    { className: "left-[6%] top-[14%] h-[22%] w-[18%] rounded-2xl", delay: 0 },
    { className: "right-[10%] top-[22%] h-[18%] w-[22%] rounded-[1.35rem]", delay: 2.2 },
    { className: "left-[18%] bottom-[12%] h-[20%] w-[26%] rounded-3xl", delay: 4.5 },
  ] as const;

  return (
    <div
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      style={{ opacity }}
    >
      {cards.map((c, i) => (
        <div
          key={i}
          className={cn(
            "kf-portal-b-card portal-bg-b__card absolute border border-white/[0.16] bg-gradient-to-br from-white/[0.06] to-transparent",
            c.className,
          )}
          style={{
            animationDelay: `${c.delay}s`,
            animationDuration: `${26 + i * 3}s`,
          }}
        />
      ))}

      <div className="pointer-events-none absolute right-[14%] top-[38%] h-[3px] w-[12%] rounded-full bg-white/[0.14]" />
      <div className="pointer-events-none absolute left-[12%] bottom-[30%] h-[3px] w-[9%] rounded-full bg-white/[0.1]" />

      <div
        className="kf-portal-b-pill pointer-events-none absolute right-[22%] top-[48%] flex items-center gap-1 rounded-full border border-white/[0.14] bg-black/35 px-2 py-0.5"
        style={{ animationDuration: `${14 * dur}s` }}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/75" />
        <span className="text-[9px] font-medium uppercase tracking-wider text-white/55">
          {t("certPill")}
        </span>
      </div>

      <div
        className="kf-portal-b-pill pointer-events-none absolute left-[26%] top-[58%] flex items-center gap-1 rounded-full border border-white/[0.12] bg-black/30 px-2 py-0.5"
        style={{ animationDuration: `${17 * dur}s`, animationDelay: "3s" }}
      >
        <span className="text-[9px] font-medium uppercase tracking-wider text-white/50">
          {t("fitPill")}
        </span>
      </div>
    </div>
  );
}

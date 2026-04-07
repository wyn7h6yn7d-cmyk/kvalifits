"use client";

import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

import type { PortalIntensity } from "./portal-tokens";
import { portalDurationScale, portalLayerOpacity } from "./portal-tokens";

/**
 * Variant B: abstraktsed kaardi-outline’id + õrn sobivus-signaal + “kontrollitud” marker.
 */
export function PortalBackgroundVariantB({
  intensity = "default",
  className,
}: {
  intensity?: PortalIntensity;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const opacity = portalLayerOpacity(intensity);
  const dur = portalDurationScale(intensity);
  const matchDur = 18 * dur;

  const cards = [
    { className: "left-[6%] top-[14%] h-[22%] w-[18%] rounded-2xl", delay: 0 },
    { className: "right-[10%] top-[22%] h-[18%] w-[22%] rounded-[1.35rem]", delay: 2.2 },
    { className: "left-[18%] bottom-[12%] h-[20%] w-[26%] rounded-3xl", delay: 4.5 },
  ] as const;

  return (
    <div
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      style={{
        opacity,
        ["--portal-match-duration" as string]: `${matchDur}s`,
      }}
    >
      {cards.map((c, i) => (
        <motion.div
          key={i}
          className={cn(
            "portal-bg-b__card absolute border border-white/[0.16] bg-gradient-to-br from-white/[0.06] to-transparent shadow-[0_0_40px_-12px_rgba(168,85,247,0.15)]",
            c.className,
          )}
          style={{ animationDelay: `${c.delay}s` }}
          animate={
            reduce
              ? undefined
              : {
                  y: [0, -10, 0],
                  rotate: [-0.45, 0.28, -0.25],
                }
          }
          transition={
            reduce
              ? undefined
              : {
                  duration: 26 + i * 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
          }
        />
      ))}

      {/* Abstraktne “töökaart” — õhuke riba nagu pealkiri */}
      <div className="pointer-events-none absolute right-[14%] top-[38%] h-[3px] w-[12%] rounded-full bg-white/[0.14]" />
      <div className="pointer-events-none absolute left-[12%] bottom-[30%] h-[3px] w-[9%] rounded-full bg-white/[0.1]" />

      {/* Sobivus — väga sumbum tekst */}
      <div
        className="portal-bg-b__match pointer-events-none absolute left-[42%] top-[40%] font-mono text-[clamp(2.5rem,6vw,4rem)] font-semibold tabular-nums text-white/[0.12]"
        aria-hidden="true"
      >
        87%
      </div>

      {/* Väikesed “kontrollitud” markerid */}
      <motion.div
        className="pointer-events-none absolute right-[22%] top-[48%] flex items-center gap-1 rounded-full border border-white/[0.14] bg-black/35 px-2 py-0.5"
        animate={reduce ? undefined : { opacity: [0.45, 0.85, 0.45] }}
        transition={
          reduce ? undefined : { duration: 14 * dur, repeat: Infinity, ease: "easeInOut" }
        }
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/75" />
        <span className="text-[9px] font-medium uppercase tracking-wider text-white/55">
          sert.
        </span>
      </motion.div>

      <motion.div
        className="pointer-events-none absolute left-[26%] top-[58%] flex items-center gap-1 rounded-full border border-white/[0.12] bg-black/30 px-2 py-0.5"
        animate={reduce ? undefined : { opacity: [0.38, 0.72, 0.38] }}
        transition={
          reduce ? undefined : { duration: 17 * dur, repeat: Infinity, ease: "easeInOut", delay: 3 }
        }
      >
        <span className="text-[9px] font-medium uppercase tracking-wider text-white/50">
          match
        </span>
      </motion.div>
    </div>
  );
}

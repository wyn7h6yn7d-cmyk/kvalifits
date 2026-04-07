"use client";

import { cn } from "@/lib/utils";

import type { PortalIntensity } from "./portal-tokens";
import { portalDurationScale, portalLayerOpacity } from "./portal-tokens";

/**
 * Variant A: sõlmed + ühendusjooned (profiil → sõlm → tööpakkumine).
 * Jooned: CSS stroke-dashoffset (üks SVG, vähe DOM-i).
 */
export function PortalBackgroundVariantA({
  intensity = "default",
  className,
}: {
  intensity?: PortalIntensity;
  className?: string;
}) {
  const opacity = portalLayerOpacity(intensity);
  const dur = portalDurationScale(intensity);
  const durBase = 48 * dur;
  const durPulse = 22 * dur;

  return (
    <div
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      style={{
        opacity,
        ["--portal-dash-duration" as string]: `${durBase}s`,
        ["--portal-pulse-duration" as string]: `${durPulse}s`,
      }}
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1000 640"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="portal-line-a" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(168,85,247,0.55)" />
            <stop offset="50%" stopColor="rgba(227,31,141,0.38)" />
            <stop offset="100%" stopColor="rgba(168,85,247,0.48)" />
          </linearGradient>
          <filter id="portal-soft-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g className="portal-bg-a--lines">
          <path
            className="portal-bg-a__path"
            d="M 140 360 Q 280 220 420 300 T 500 280"
            fill="none"
            stroke="url(#portal-line-a)"
            strokeWidth="1.45"
            strokeLinecap="round"
            strokeOpacity="0.78"
          />
          <path
            className="portal-bg-a__path"
            d="M 500 280 Q 620 200 760 260 T 900 200"
            fill="none"
            stroke="url(#portal-line-a)"
            strokeWidth="1.45"
            strokeLinecap="round"
            strokeOpacity="0.78"
          />
          <path
            className="portal-bg-a__path"
            d="M 500 280 Q 540 420 520 520"
            fill="none"
            stroke="url(#portal-line-a)"
            strokeWidth="1.15"
            strokeLinecap="round"
            strokeOpacity="0.62"
          />
          <path
            className="portal-bg-a__path"
            d="M 220 420 Q 360 480 500 280"
            fill="none"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="1.05"
            strokeLinecap="round"
            strokeOpacity="0.72"
          />
        </g>

        <g filter="url(#portal-soft-glow)">
          <circle
            cx="140"
            cy="360"
            r="5"
            fill="rgba(255,255,255,0.16)"
            stroke="rgba(255,255,255,0.32)"
            strokeWidth="1"
          />
          <circle
            cx="220"
            cy="420"
            r="4.5"
            fill="rgba(255,255,255,0.1)"
            stroke="rgba(255,255,255,0.26)"
            strokeWidth="0.9"
          />
          <circle
            cx="500"
            cy="280"
            r="7"
            fill="rgba(168,85,247,0.22)"
            stroke="rgba(168,85,247,0.55)"
            strokeWidth="1.15"
          />
          <circle
            cx="900"
            cy="200"
            r="5"
            fill="rgba(227,31,141,0.18)"
            stroke="rgba(227,31,141,0.45)"
            strokeWidth="1"
          />
          <circle
            cx="520"
            cy="520"
            r="4"
            fill="rgba(255,255,255,0.09)"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="0.85"
          />
        </g>

        <circle
          className="portal-bg-a__hub-ring"
          cx="500"
          cy="280"
          r="18"
          fill="none"
          stroke="rgba(168,85,247,0.48)"
          strokeWidth="1.05"
        />
      </svg>
    </div>
  );
}

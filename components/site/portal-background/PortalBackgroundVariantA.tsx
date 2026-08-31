import { cn } from "@/lib/utils";

import type { PortalIntensity } from "./portal-tokens";
import { portalDurationScale, portalLayerOpacity } from "./portal-tokens";

/**
 * Connection network — profile → hub → job posting.
 * Lines animate via stroke-dashoffset; no decorative dot clutter.
 */
export function PortalBackgroundVariantA({
  intensity = "soft",
  className,
}: {
  intensity?: PortalIntensity;
  className?: string;
}) {
  const opacity = portalLayerOpacity(intensity) * 0.72;
  const dur = portalDurationScale(intensity);
  const durBase = 72 * dur;
  const durPulse = 36 * dur;

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
        className="homepage-motion-network absolute inset-0 h-full w-full"
        viewBox="0 0 1000 640"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="portal-line-a" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(99,102,241,0.32)" />
            <stop offset="50%" stopColor="rgba(168,85,247,0.24)" />
            <stop offset="100%" stopColor="rgba(227,31,141,0.18)" />
          </linearGradient>
          <linearGradient id="portal-line-b" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(99,102,241,0.14)" />
            <stop offset="100%" stopColor="rgba(168,85,247,0.10)" />
          </linearGradient>
        </defs>

        <g className="portal-bg-a--lines">
          <path
            className="portal-bg-a__path portal-bg-a__path--d1"
            d="M 140 360 Q 280 220 420 300 T 500 280"
            fill="none"
            stroke="url(#portal-line-a)"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
          <path
            className="portal-bg-a__path portal-bg-a__path--d2"
            d="M 500 280 Q 620 200 760 260 T 900 200"
            fill="none"
            stroke="url(#portal-line-a)"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
          <path
            className="portal-bg-a__path portal-bg-a__path--d3"
            d="M 500 280 Q 540 420 520 520"
            fill="none"
            stroke="url(#portal-line-b)"
            strokeWidth="0.9"
            strokeLinecap="round"
          />
          <path
            className="portal-bg-a__path portal-bg-a__path--d4"
            d="M 220 420 Q 360 480 500 280"
            fill="none"
            stroke="rgba(255,255,255,0.10)"
            strokeWidth="0.85"
            strokeLinecap="round"
          />
          <path
            className="portal-bg-a__path portal-bg-a__path--d5"
            d="M 760 260 Q 680 340 520 520"
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="0.75"
            strokeLinecap="round"
          />
        </g>

        <circle
          className="portal-bg-a__hub-ring"
          cx="500"
          cy="280"
          r="16"
          fill="none"
          stroke="rgba(168,85,247,0.22)"
          strokeWidth="0.9"
        />
        <circle
          className="portal-bg-a__hub-core"
          cx="500"
          cy="280"
          r="3"
          fill="rgba(168,85,247,0.14)"
          stroke="rgba(168,85,247,0.28)"
          strokeWidth="0.75"
        />
      </svg>
    </div>
  );
}

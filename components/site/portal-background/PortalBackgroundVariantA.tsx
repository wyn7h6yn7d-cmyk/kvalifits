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
  const opacity = portalLayerOpacity(intensity);
  const dur = portalDurationScale(intensity);
  const durBase = 58 * dur;
  const durPulse = 28 * dur;

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
            <stop offset="0%" stopColor="rgba(99,102,241,0.46)" />
            <stop offset="50%" stopColor="rgba(168,85,247,0.34)" />
            <stop offset="100%" stopColor="rgba(227,31,141,0.24)" />
          </linearGradient>
          <linearGradient id="portal-line-b" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(99,102,241,0.22)" />
            <stop offset="100%" stopColor="rgba(168,85,247,0.16)" />
          </linearGradient>
          <linearGradient id="portal-line-c" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="rgba(129,140,248,0.08)" />
            <stop offset="45%" stopColor="rgba(168,85,247,0.28)" />
            <stop offset="100%" stopColor="rgba(99,102,241,0.08)" />
          </linearGradient>
        </defs>

        <g className="portal-bg-a--lines">
          <path
            className="portal-bg-a__path portal-bg-a__path--d1"
            d="M 140 360 Q 280 220 420 300 T 500 280"
            fill="none"
            stroke="url(#portal-line-a)"
            strokeWidth="1.35"
            strokeLinecap="round"
          />
          <path
            className="portal-bg-a__path portal-bg-a__path--d2"
            d="M 500 280 Q 620 200 760 260 T 900 200"
            fill="none"
            stroke="url(#portal-line-a)"
            strokeWidth="1.35"
            strokeLinecap="round"
          />
          <path
            className="portal-bg-a__path portal-bg-a__path--d3"
            d="M 500 280 Q 540 420 520 520"
            fill="none"
            stroke="url(#portal-line-b)"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
          <path
            className="portal-bg-a__path portal-bg-a__path--d4"
            d="M 220 420 Q 360 480 500 280"
            fill="none"
            stroke="rgba(255,255,255,0.16)"
            strokeWidth="1"
            strokeLinecap="round"
          />
          <path
            className="portal-bg-a__path portal-bg-a__path--d5"
            d="M 760 260 Q 680 340 520 520"
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="0.9"
            strokeLinecap="round"
          />
          <path
            className="portal-bg-a__path portal-bg-a__path--d6"
            d="M 80 260 Q 220 180 360 240 T 500 280"
            fill="none"
            stroke="url(#portal-line-c)"
            strokeWidth="0.95"
            strokeLinecap="round"
          />
          <path
            className="portal-bg-a__path portal-bg-a__path--d7"
            d="M 900 360 Q 780 440 640 380 T 500 280"
            fill="none"
            stroke="url(#portal-line-c)"
            strokeWidth="0.95"
            strokeLinecap="round"
          />
        </g>

        <circle
          className="portal-bg-a__hub-ring portal-bg-a__hub-ring--outer"
          cx="500"
          cy="280"
          r="24"
          fill="none"
          stroke="rgba(99,102,241,0.14)"
          strokeWidth="0.75"
        />
        <circle
          className="portal-bg-a__hub-ring"
          cx="500"
          cy="280"
          r="16"
          fill="none"
          stroke="rgba(168,85,247,0.32)"
          strokeWidth="1"
        />
        <circle
          className="portal-bg-a__hub-core"
          cx="500"
          cy="280"
          r="3.5"
          fill="rgba(168,85,247,0.22)"
          stroke="rgba(168,85,247,0.42)"
          strokeWidth="0.85"
        />
        <g transform="translate(500 280)">
          <path
            className="homepage-hero-radar-sweep"
            d="M 0 0 L 0 -84 A 84 84 0 0 1 84 0 Z"
            fill="rgba(99,102,241,0.12)"
            stroke="rgba(168,85,247,0.22)"
            strokeWidth="0.5"
          />
        </g>
      </svg>
    </div>
  );
}

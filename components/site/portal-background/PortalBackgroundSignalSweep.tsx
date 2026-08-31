import { cn } from "@/lib/utils";

const RINGS = [
  { r: 48, delay: "0s", mobile: true },
  { r: 84, delay: "8s", mobile: true },
  { r: 120, delay: "16s", mobile: false },
] as const;

/**
 * Subtle radar/signal rings from the match hub — slow expand, low opacity.
 */
export function PortalBackgroundSignalSweep({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden opacity-[0.72] sm:opacity-[0.78]", className)}>
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1000 640"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <g transform="translate(500 280)">
          <g className="homepage-hero-radar-sweep">
            <path
              d="M 0 0 L 0 -84 A 84 84 0 0 1 84 0 Z"
              fill="rgba(99,102,241,0.12)"
              stroke="rgba(168,85,247,0.22)"
              strokeWidth="0.5"
            />
          </g>
          {RINGS.map((ring) => (
            <circle
              key={ring.r}
              r={ring.r}
              fill="none"
              stroke="rgba(99,102,241,0.22)"
              strokeWidth="0.75"
              className={cn(
                "homepage-motion-signal-ring",
                !ring.mobile && "hidden sm:block",
              )}
              style={{ animationDelay: ring.delay }}
            />
          ))}
          <circle
            r={32}
            fill="none"
            stroke="rgba(227,31,141,0.16)"
            strokeWidth="0.65"
            className="homepage-motion-signal-ring homepage-motion-signal-ring--pink"
            style={{ animationDelay: "4s" }}
          />
        </g>
      </svg>
    </div>
  );
}

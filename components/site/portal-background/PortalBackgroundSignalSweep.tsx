import { cn } from "@/lib/utils";

const RINGS = [
  { r: 52, delay: "0s" },
  { r: 88, delay: "9s" },
  { r: 124, delay: "18s" },
] as const;

/**
 * Subtle radar/signal rings from the match hub — slow expand, low opacity.
 */
export function PortalBackgroundSignalSweep({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden opacity-[0.55]", className)}>
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1000 640"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <g transform="translate(500 280)">
          {RINGS.map((ring) => (
            <circle
              key={ring.r}
              r={ring.r}
              fill="none"
              stroke="rgba(99,102,241,0.16)"
              strokeWidth="0.65"
              className="homepage-motion-signal-ring"
              style={{ animationDelay: ring.delay }}
            />
          ))}
          <circle
            r={36}
            fill="none"
            stroke="rgba(227,31,141,0.10)"
            strokeWidth="0.5"
            className="homepage-motion-signal-ring homepage-motion-signal-ring--pink"
            style={{ animationDelay: "4.5s" }}
          />
        </g>
      </svg>
    </div>
  );
}

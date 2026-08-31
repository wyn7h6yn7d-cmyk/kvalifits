import { cn } from "@/lib/utils";

/**
 * Hero ambient — indigo/violet wash with a small pink accent corner.
 */
export function AmbientBackground({
  className,
  intensity = "soft",
}: {
  className?: string;
  intensity?: "soft" | "default" | "strong";
}) {
  const opacity = intensity === "soft" ? 0.16 : intensity === "strong" ? 0.26 : 0.21;
  const pinkOpacity = intensity === "soft" ? 0.08 : intensity === "strong" ? 0.14 : 0.11;

  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <div
        className="kf-ambient-orb absolute -top-36 left-1/2 h-[420px] w-[640px] -translate-x-1/2 rounded-full blur-3xl lg:-top-44 lg:h-[520px] lg:w-[820px]"
        style={{
          opacity,
          background:
            "radial-gradient(circle at 50% 42%, rgba(99,102,241,0.28), rgba(129,140,248,0.12), rgba(168,85,247,0.06), rgba(7,7,12,0) 68%)",
        }}
      />
      <div
        className="absolute -bottom-16 right-[8%] h-48 w-48 rounded-full blur-3xl lg:-bottom-8 lg:right-[12%] lg:h-56 lg:w-56"
        style={{
          opacity: pinkOpacity,
          background: "radial-gradient(circle, rgba(227,31,141,0.35), transparent 70%)",
        }}
      />
    </div>
  );
}

import { cn } from "@/lib/utils";

/**
 * Hero ambient — indigo/violet wash with a small pink accent.
 * `layout="hero"` keeps orbs in empty zones (left / top), away from the person photo.
 */
export function AmbientBackground({
  className,
  intensity = "soft",
  layout = "default",
}: {
  className?: string;
  intensity?: "soft" | "default" | "strong";
  layout?: "default" | "hero";
}) {
  const opacity = intensity === "soft" ? 0.22 : intensity === "strong" ? 0.34 : 0.28;
  const pinkOpacity = intensity === "soft" ? 0.12 : intensity === "strong" ? 0.2 : 0.16;
  const sideOpacity = intensity === "soft" ? 0.14 : intensity === "strong" ? 0.22 : 0.18;
  const hero = layout === "hero";

  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <div
        className={cn(
          "kf-ambient-orb absolute h-[420px] w-[640px] -translate-x-1/2 rounded-full blur-3xl lg:h-[520px] lg:w-[820px]",
          hero
            ? "-top-40 left-[28%] opacity-90 lg:-top-48 lg:left-[32%]"
            : "-top-36 left-1/2 lg:-top-44",
        )}
        style={{
          opacity: hero ? opacity * 0.85 : opacity,
          background:
            "radial-gradient(circle at 50% 42%, rgba(99,102,241,0.38), rgba(129,140,248,0.18), rgba(168,85,247,0.1), rgba(7,7,12,0) 68%)",
        }}
      />
      <div
        className={cn(
          "kf-ambient-orb-b absolute h-48 w-48 rounded-full blur-3xl lg:h-56 lg:w-56",
          hero
            ? "bottom-[12%] left-[8%] lg:bottom-[18%] lg:left-[10%]"
            : "-bottom-16 right-[8%] lg:-bottom-8 lg:right-[12%]",
        )}
        style={{
          opacity: hero ? pinkOpacity * 0.7 : pinkOpacity,
          background: "radial-gradient(circle, rgba(227,31,141,0.42), rgba(168,85,247,0.12), transparent 72%)",
        }}
      />
      <div
        className={cn(
          "kf-ambient-orb-c absolute h-56 w-56 rounded-full blur-3xl sm:h-64 sm:w-64 lg:h-72 lg:w-72",
          hero
            ? "-left-10 top-[42%] sm:-left-4 lg:left-[2%]"
            : "-left-12 top-[38%] sm:-left-6 lg:left-[4%]",
        )}
        style={{
          opacity: hero ? sideOpacity * 1.05 : sideOpacity,
          background:
            "radial-gradient(circle, rgba(79,70,229,0.32), rgba(99,102,241,0.14), transparent 70%)",
        }}
      />
    </div>
  );
}

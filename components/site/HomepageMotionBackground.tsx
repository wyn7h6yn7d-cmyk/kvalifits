import { AmbientBackground } from "@/components/site/AmbientBackground";
import { HeroMotionAurora } from "@/components/site/portal-background/HeroMotionAurora";
import { HeroMotionRoot } from "@/components/site/HeroMotionRoot";
import { cn } from "@/lib/utils";

/**
 * Lean hero atmosphere — one aurora + soft wash (no SVG network layer).
 * Motion pauses when offscreen via HeroMotionRoot.
 */
export function HomepageMotionBackground({ className }: { className?: string }) {
  return (
    <HeroMotionRoot
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      {/* Soft static wash — no blur-3xl stack on mobile */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_20%_-5%,rgba(99,102,241,0.07),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_88%_70%,rgba(227,31,141,0.035),transparent_65%)] max-lg:opacity-70" />

      {/* Desktop-only soft ambient orbs; mobile skips blur layers */}
      <div className="absolute inset-0 hidden lg:block">
        <AmbientBackground intensity="soft" layout="hero" />
      </div>

      <div className="homepage-hero-tech-mask absolute inset-0 opacity-[0.85] max-lg:opacity-[0.55]">
        <HeroMotionAurora
          className="opacity-[0.10] sm:opacity-[0.12] lg:opacity-[0.14]"
          bias="empty"
        />
      </div>

      <div className="absolute inset-0 z-[1]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(7,7,12,0.16)_70%,rgba(7,7,12,0.5)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#07070c]/40 via-transparent to-[var(--background)]/90" />
      </div>
    </HeroMotionRoot>
  );
}

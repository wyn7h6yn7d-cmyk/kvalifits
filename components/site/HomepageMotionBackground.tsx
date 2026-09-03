import { AmbientBackground } from "@/components/site/AmbientBackground";
import { HeroMotionAurora } from "@/components/site/portal-background/HeroMotionAurora";
import { PortalBackgroundVariantA } from "@/components/site/portal-background/PortalBackgroundVariantA";
import { heroPortal } from "@/lib/site-portal-config";
import { cn } from "@/lib/utils";

/**
 * Human Premium hero motion — atmosphere only.
 * Strongest in empty zones (copy side / margins); masked away from the person photo.
 * Photo stays foreground; technology stays second.
 */
export function HomepageMotionBackground({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      {/* Soft color wash — biased to empty left / top, not the face */}
      <AmbientBackground intensity={heroPortal.ambientIntensity} layout="hero" />

      {/*
        Network + aurora: kept, but masked so lines/glow do not sit on the person.
        Mobile: motion in upper band; desktop: motion on copy / left side.
      */}
      <div className="homepage-hero-tech-mask absolute inset-0">
        <HeroMotionAurora className="opacity-[0.11] sm:opacity-[0.13] lg:opacity-[0.15]" bias="empty" />
        <div className="absolute inset-0 opacity-[0.14] sm:opacity-[0.16] lg:opacity-[0.18]">
          <PortalBackgroundVariantA intensity={heroPortal.intensity} />
        </div>
      </div>

      {/* Extra face-safe veil — kills residual tech under soft photo edges */}
      <div className="absolute inset-0 z-[1]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_78%_42%,rgba(7,7,12,0.55)_0%,transparent_62%)] max-lg:bg-[radial-gradient(ellipse_85%_55%_at_50%_78%,rgba(7,7,12,0.5)_0%,transparent_58%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_55%_at_18%_-6%,rgba(99,102,241,0.045),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(7,7,12,0.18)_62%,rgba(7,7,12,0.52)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#07070c]/50 via-transparent to-[var(--background)]/88" />
      </div>
    </div>
  );
}

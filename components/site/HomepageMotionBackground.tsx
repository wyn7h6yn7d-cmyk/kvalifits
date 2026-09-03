import { AmbientBackground } from "@/components/site/AmbientBackground";
import { HeroMotionAurora } from "@/components/site/portal-background/HeroMotionAurora";
import { PortalBackgroundVariantA } from "@/components/site/portal-background/PortalBackgroundVariantA";
import { heroPortal } from "@/lib/site-portal-config";
import { cn } from "@/lib/utils";

/**
 * Quiet Human Premium motion — atmosphere only.
 * Stronger on the empty/copy side; fades under the person so the face stays clean.
 */
export function HomepageMotionBackground({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      <AmbientBackground intensity="soft" layout="hero" />

      <div className="homepage-hero-tech-mask absolute inset-0">
        <HeroMotionAurora className="opacity-[0.09] sm:opacity-[0.11] lg:opacity-[0.12]" bias="empty" />
        <div className="absolute inset-0 opacity-[0.10] sm:opacity-[0.12] lg:opacity-[0.13]">
          <PortalBackgroundVariantA intensity={heroPortal.intensity} />
        </div>
      </div>

      <div className="absolute inset-0 z-[1]">
        {/* Soft indigo undertone left; pink only as a tiny corner hint */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_50%_at_12%_-10%,rgba(99,102,241,0.035),transparent_58%)]" />
        <div className="absolute bottom-0 left-[8%] h-[28%] w-[22%] bg-[radial-gradient(ellipse_at_center,rgba(227,31,141,0.025),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_65%_55%_at_82%_42%,rgba(7,7,12,0.55)_0%,transparent_65%)] max-lg:bg-[radial-gradient(ellipse_90%_45%_at_50%_85%,rgba(7,7,12,0.45)_0%,transparent_58%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(7,7,12,0.22)_62%,rgba(7,7,12,0.55)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#07070c]/50 via-transparent to-[var(--background)]/90" />
      </div>
    </div>
  );
}

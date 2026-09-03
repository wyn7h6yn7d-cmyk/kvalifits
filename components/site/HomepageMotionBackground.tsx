import { AmbientBackground } from "@/components/site/AmbientBackground";
import { HeroMotionAurora } from "@/components/site/portal-background/HeroMotionAurora";
import { PortalBackgroundVariantA } from "@/components/site/portal-background/PortalBackgroundVariantA";
import { heroPortal } from "@/lib/site-portal-config";
import { cn } from "@/lib/utils";

/**
 * Human Premium hero motion — quiet atmosphere behind the split hero.
 * Stronger on the copy side; fades under the person photo.
 */
export function HomepageMotionBackground({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      <AmbientBackground intensity={heroPortal.ambientIntensity} layout="hero" />

      <div className="homepage-hero-tech-mask absolute inset-0">
        <HeroMotionAurora className="opacity-[0.10] sm:opacity-[0.12] lg:opacity-[0.14]" bias="empty" />
        <div className="absolute inset-0 opacity-[0.12] sm:opacity-[0.14] lg:opacity-[0.16]">
          <PortalBackgroundVariantA intensity={heroPortal.intensity} />
        </div>
      </div>

      <div className="absolute inset-0 z-[1]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_78%_42%,rgba(7,7,12,0.45)_0%,transparent_62%)] max-lg:bg-[radial-gradient(ellipse_85%_50%_at_50%_78%,rgba(7,7,12,0.4)_0%,transparent_58%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_55%_at_18%_-6%,rgba(99,102,241,0.03),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(7,7,12,0.22)_58%,rgba(7,7,12,0.55)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#07070c]/50 via-transparent to-[var(--background)]/88" />
      </div>
    </div>
  );
}

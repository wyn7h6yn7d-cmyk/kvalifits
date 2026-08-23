import { AmbientBackground } from "@/components/site/AmbientBackground";
import { PortalBackgroundVariantA } from "@/components/site/portal-background/PortalBackgroundVariantA";
import { heroPortal } from "@/lib/site-portal-config";
import { cn } from "@/lib/utils";

export function HeroBackdrop({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0", className)} aria-hidden>
      <AmbientBackground intensity={heroPortal.ambientIntensity} />
      <div className="absolute inset-0 z-0 hidden lg:block">
        <PortalBackgroundVariantA intensity={heroPortal.intensity} />
      </div>

      <div className="absolute inset-0 z-[1]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_-10%,rgba(168,85,247,0.16),transparent_58%)] lg:bg-[radial-gradient(ellipse_130%_90%_at_50%_-15%,rgba(168,85,247,0.28),transparent_55%)]" />
        <div className="absolute inset-0 hidden bg-gradient-to-b from-[#09090D]/35 via-transparent to-transparent lg:block" />
        <div className="absolute inset-0 hidden bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(9,9,13,0.22)_100%)] opacity-70 lg:block" />
      </div>

      <div className="absolute inset-x-0 top-0 z-[2] h-36 bg-gradient-to-b from-[#09090D]/95 via-[#09090D]/50 to-transparent sm:h-40" />
    </div>
  );
}

import { AmbientBackground } from "@/components/site/AmbientBackground";
import { PortalBackgroundVariantA } from "@/components/site/portal-background/PortalBackgroundVariantA";
import { Container } from "@/components/ui/container";
import { HeroContent } from "@/components/sections/HeroContent";
import { heroPortal } from "@/lib/site-portal-config";
import type { HeroQuickFilterId } from "@/lib/jobs/heroQuickFilters";

export function Hero({ quickFilters }: { quickFilters: HeroQuickFilterId[] }) {
  return (
    <section
      id="avaleht"
      className="relative overflow-hidden scroll-mt-[var(--site-header-offset)] bg-surface-deep pb-8 sm:pb-10 lg:pb-14"
    >
      <AmbientBackground intensity={heroPortal.ambientIntensity} />
      <div className="absolute inset-0 z-0 hidden lg:block">
        <PortalBackgroundVariantA intensity={heroPortal.intensity} />
      </div>

      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_-10%,rgba(168,85,247,0.16),transparent_58%)] lg:bg-[radial-gradient(ellipse_130%_90%_at_50%_-15%,rgba(168,85,247,0.28),transparent_55%)]" />
        <div className="absolute inset-0 hidden bg-gradient-to-b from-[#09090D]/35 via-transparent to-transparent lg:block" />
        <div className="absolute inset-0 hidden bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(9,9,13,0.28)_100%)] opacity-70 lg:block" />
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-32 bg-gradient-to-b from-transparent via-[#0F0F16]/55 to-[#0F0F16] sm:h-40"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-36 bg-gradient-to-b from-[#09090D]/95 via-[#09090D]/50 to-transparent sm:h-40"
      />

      <Container className="relative z-10">
        <div className="flex flex-col justify-start" style={{ paddingTop: "var(--site-hero-content-top)" }}>
          <HeroContent quickFilters={quickFilters} />
        </div>
      </Container>
    </section>
  );
}

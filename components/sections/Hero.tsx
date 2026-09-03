import { Container } from "@/components/ui/container";
import { HeroContent } from "@/components/sections/HeroContent";
import type { HeroQuickFilterId } from "@/lib/jobs/heroQuickFilters";
import { cn } from "@/lib/utils";

/**
 * Homepage hero — search-first Human Premium.
 * Desktop uses most of the viewport height; ~70% of the band is for finding work.
 */
export function Hero({
  quickFilters,
  embedded = false,
}: {
  quickFilters: HeroQuickFilterId[];
  embedded?: boolean;
}) {
  return (
    <section
      id="avaleht"
      className={cn(
        "relative scroll-mt-[var(--site-header-offset)]",
        embedded
          ? "pb-8 sm:pb-10 lg:pb-12"
          : "overflow-hidden bg-surface-deep pb-8 sm:pb-10 lg:pb-12",
      )}
    >
      <Container className="relative z-10">
        <div
          className={cn(
            "flex flex-col justify-center",
            embedded &&
              "lg:min-h-[min(74svh,calc(100svh-var(--site-header-offset)-2rem))]",
          )}
          style={{ paddingTop: "var(--site-hero-content-top)" }}
        >
          <HeroContent quickFilters={quickFilters} />
        </div>
      </Container>
    </section>
  );
}

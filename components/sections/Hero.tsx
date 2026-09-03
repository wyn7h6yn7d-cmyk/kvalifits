import { Container } from "@/components/ui/container";
import { HeroContent } from "@/components/sections/HeroContent";
import type { HeroQuickFilterId } from "@/lib/jobs/heroQuickFilters";
import { cn } from "@/lib/utils";

/**
 * Homepage hero — search-first live match system.
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
          ? "pb-10 sm:pb-12 lg:pb-14"
          : "overflow-hidden bg-surface-deep pb-10 sm:pb-12 lg:pb-14",
      )}
    >
      <Container className="relative z-10">
        <div
          className={cn(
            "flex flex-col justify-center",
            embedded &&
              "lg:min-h-[min(68svh,calc(100svh-var(--site-header-offset)-2rem))]",
          )}
          style={{ paddingTop: "var(--site-hero-content-top)" }}
        >
          <HeroContent quickFilters={quickFilters} />
        </div>
      </Container>
    </section>
  );
}

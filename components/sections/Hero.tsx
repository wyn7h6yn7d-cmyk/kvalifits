import { Container } from "@/components/ui/container";
import { HeroContent } from "@/components/sections/HeroContent";
import type { HeroQuickFilterId } from "@/lib/jobs/heroQuickFilters";
import { cn } from "@/lib/utils";

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
        embedded ? "pb-16 sm:pb-20 lg:pb-24" : "overflow-hidden bg-surface-deep pb-16 sm:pb-20 lg:pb-24",
      )}
    >
      <Container className="relative z-10">
        <div
          className={cn(
            "flex flex-col justify-center",
            embedded &&
              "min-h-[min(68svh,calc(100svh-var(--site-header-offset)-2.5rem))] lg:min-h-[min(72svh,calc(100svh-var(--site-header-offset)-3rem))]",
          )}
          style={{ paddingTop: "var(--site-hero-content-top)" }}
        >
          <HeroContent quickFilters={quickFilters} />
        </div>
      </Container>
    </section>
  );
}

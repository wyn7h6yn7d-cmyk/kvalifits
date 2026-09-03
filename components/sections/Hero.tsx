import { Container } from "@/components/ui/container";
import { HeroContent } from "@/components/sections/HeroContent";
import type { HeroQuickFilterId } from "@/lib/jobs/heroQuickFilters";
import { cn } from "@/lib/utils";

/**
 * Homepage mega hero — emotion + clear value + job search.
 * Desktop ~75–85vh; content uses full container width in a 2-column split.
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
              "min-h-[min(78svh,calc(100svh-var(--site-header-offset)-1.5rem))] lg:min-h-[min(82svh,calc(100svh-var(--site-header-offset)-2rem))]",
          )}
          style={{ paddingTop: "var(--site-hero-content-top)" }}
        >
          <HeroContent quickFilters={quickFilters} />
        </div>
      </Container>
    </section>
  );
}

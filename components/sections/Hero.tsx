import { Container } from "@/components/ui/container";
import { HeroContent } from "@/components/sections/HeroContent";
import type { HeroQuickFilterId } from "@/lib/jobs/heroQuickFilters";
import { cn } from "@/lib/utils";

export function Hero({
  quickFilters,
  publishedJobCount = 0,
  showScrollHint = false,
  embedded = false,
}: {
  quickFilters: HeroQuickFilterId[];
  publishedJobCount?: number;
  showScrollHint?: boolean;
  embedded?: boolean;
}) {
  return (
    <section
      id="avaleht"
      className={cn(
        "relative scroll-mt-[var(--site-header-offset)]",
        embedded ? "pb-6 sm:pb-8 lg:pb-10" : "overflow-hidden bg-surface-deep pb-8 sm:pb-10 lg:pb-14",
      )}
    >
      <Container className="relative z-10">
        <div
          className={cn(
            "flex flex-col justify-start",
            embedded &&
              "lg:min-h-[min(70svh,calc(100svh-var(--site-header-offset)-6rem))]",
          )}
          style={{ paddingTop: "var(--site-hero-content-top)" }}
        >
          <HeroContent
            quickFilters={quickFilters}
            publishedJobCount={publishedJobCount}
            showScrollHint={showScrollHint}
          />
        </div>
      </Container>
    </section>
  );
}

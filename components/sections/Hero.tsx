import { Container } from "@/components/ui/container";
import { HeroContent } from "@/components/sections/HeroContent";
import type { HeroQuickFilterId } from "@/lib/jobs/heroQuickFilters";

export function Hero({
  quickFilters,
  publishedJobCount = 0,
}: {
  quickFilters: HeroQuickFilterId[];
  publishedJobCount?: number;
}) {
  return (
    <section
      id="avaleht"
      className="relative scroll-mt-[var(--site-header-offset)] pb-6 sm:pb-7 lg:pb-8"
    >
      <Container className="relative z-10">
        <div style={{ paddingTop: "var(--site-hero-content-top)" }}>
          <HeroContent quickFilters={quickFilters} publishedJobCount={publishedJobCount} />
        </div>
      </Container>
    </section>
  );
}

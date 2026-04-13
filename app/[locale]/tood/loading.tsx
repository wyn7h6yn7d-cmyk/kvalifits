import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { Container } from "@/components/ui/container";

export default function ToodLoading() {
  return (
    <div className="flex-1 bg-background">
      <Navbar />
      <main className="pt-[var(--site-header-offset)]">
        <section className="relative overflow-hidden">
          <Container className="relative">
            <div className="mx-auto max-w-3xl pb-16 pt-20 sm:pb-20 sm:pt-24 lg:pt-28">
              <div className="animate-pulse space-y-5">
                <div className="h-3 w-28 rounded-full bg-white/[0.08]" />
                <div className="h-10 w-full max-w-lg rounded-xl bg-white/[0.06] sm:h-12" />
                <div className="h-24 max-w-2xl rounded-xl bg-white/[0.04]" />
              </div>
            </div>
          </Container>
        </section>

        <section className="py-14 sm:py-16">
          <Container>
            <div className="mb-8 animate-pulse rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 lg:mb-10">
              <div className="h-5 w-40 rounded bg-white/[0.08]" />
              <div className="mt-6 h-11 w-full max-w-xl rounded-xl bg-white/[0.05]" />
            </div>
            <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
              <div className="animate-pulse space-y-4 rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6">
                <div className="h-5 w-24 rounded bg-white/[0.08]" />
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-8 w-20 rounded-full bg-white/[0.06]" />
                  ))}
                </div>
              </div>
              <div className="grid gap-5 lg:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6"
                  >
                    <div className="h-6 w-3/4 rounded-lg bg-white/[0.08]" />
                    <div className="mt-4 h-4 w-1/2 rounded bg-white/[0.05]" />
                    <div className="mt-6 h-16 rounded-lg bg-white/[0.04]" />
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </div>
  );
}

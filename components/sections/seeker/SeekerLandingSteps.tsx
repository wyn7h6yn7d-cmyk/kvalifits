import { Container } from "@/components/ui/container";
import { SITE_EYEBROW, SITE_H2_SECTION } from "@/lib/site/publicPageLayout";
import { cn } from "@/lib/utils";

type Step = {
  title: string;
  body: string;
};

type Props = {
  eyebrow: string;
  title: string;
  steps: readonly Step[];
  contentClassName?: string;
};

export function SeekerLandingSteps({ eyebrow, title, steps, contentClassName }: Props) {
  return (
    <section className="bg-background py-12 sm:py-16 lg:py-20">
      <Container>
        <div className={cn("w-full max-w-5xl", contentClassName)}>
          <div className="mb-5 flex items-center gap-3" aria-hidden>
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-pink)]/80" />
            <span className="h-px w-10 bg-white/[0.14]" />
          </div>
          <div className={SITE_EYEBROW}>{eyebrow}</div>
          <h2 className={cn("mt-3 sm:mt-3.5", SITE_H2_SECTION, "lg:text-[2.125rem]")}>{title}</h2>
        </div>

        <ol className={cn("relative mt-12 list-none sm:mt-14 lg:mt-16", "w-full max-w-5xl", contentClassName)}>
          {/* Desktop horizontal connector */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-[8%] right-[8%] top-[1.375rem] hidden h-px bg-white/[0.12] lg:block"
          />

          <div className="grid gap-8 sm:gap-10 lg:grid-cols-5 lg:gap-5 xl:gap-6">
            {steps.map((step, index) => (
              <li key={step.title} className="relative min-w-0 lg:pt-0">
                {/* Mobile / tablet vertical timeline */}
                <div
                  aria-hidden
                  className={cn(
                    "absolute left-[1.0625rem] top-10 bottom-0 w-px bg-white/[0.10] lg:hidden",
                    index === steps.length - 1 && "hidden",
                  )}
                />

                <div className="relative flex gap-4 sm:gap-5 lg:flex-col lg:gap-0">
                  <div className="relative z-[1] flex shrink-0 lg:mb-5 lg:justify-center">
                    <span
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.14] bg-background",
                        "text-[0.8125rem] font-bold tabular-nums text-violet-300/90 sm:h-10 sm:w-10 sm:text-[0.875rem]",
                        "lg:h-11 lg:w-11 lg:text-[0.9375rem]",
                      )}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1 pb-2 lg:pb-0">
                    <div className="text-[1.0625rem] font-semibold leading-snug text-foreground sm:text-[1.125rem] lg:text-center lg:text-[1.0625rem] xl:text-[1.125rem]">
                      {step.title}
                    </div>
                    <p
                      className={cn(
                        "mt-2 text-[0.9375rem] leading-[1.68] text-muted sm:mt-2.5 sm:text-base sm:leading-[1.7]",
                        "lg:mt-3 lg:text-center lg:text-[0.9375rem] xl:text-base",
                      )}
                    >
                      {step.body}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </div>
        </ol>
      </Container>
    </section>
  );
}

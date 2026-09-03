import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

type Props = {
  steps: readonly string[];
};

/** Quiet numbered list — editorial, not a SaaS feature card grid. */
export function EmployerLandingSteps({ steps }: Props) {
  return (
    <section className="bg-background py-10 sm:py-14 lg:py-16">
      <Container>
        <ol className="mx-auto max-w-3xl list-none divide-y divide-white/[0.07] border-y border-white/[0.07]">
          {steps.map((step, index) => (
            <li
              key={step}
              className="grid gap-3 py-7 sm:grid-cols-[4.5rem_minmax(0,1fr)] sm:items-baseline sm:gap-8 sm:py-8"
            >
              <span
                className={cn(
                  "text-[0.8125rem] font-medium tabular-nums tracking-[0.08em] text-[var(--accent-pink)]/80",
                )}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="text-[1.125rem] font-semibold leading-snug text-foreground sm:text-[1.1875rem] lg:text-[1.25rem]">
                {step}
              </p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

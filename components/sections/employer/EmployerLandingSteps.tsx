import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

type Props = {
  steps: readonly string[];
};

export function EmployerLandingSteps({ steps }: Props) {
  return (
    <section className="bg-background py-6 sm:py-8 lg:py-10">
      <Container>
        <ol className="grid list-none gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {steps.map((step, index) => (
            <li key={step} className="relative min-w-0">
              <div
                className={cn(
                  "flex h-full flex-col rounded-2xl border border-white/[0.11]",
                  "bg-[linear-gradient(165deg,rgba(22,22,32,0.96)_0%,rgba(14,14,21,0.94)_100%)]",
                  "px-5 py-5 shadow-[0_20px_56px_-40px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.07)]",
                  "sm:px-5 sm:py-6",
                )}
              >
                <span className="text-[1.75rem] font-bold tabular-nums leading-none tracking-[-0.04em] text-violet-300/90 sm:text-[2rem]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="mt-3 text-[1.0625rem] font-semibold leading-snug text-foreground sm:mt-4 sm:text-[1.125rem] lg:text-[1.1875rem]">
                  {step}
                </p>
              </div>
              {index < steps.length - 1 ? (
                <span
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 hidden h-px w-5 -translate-y-1/2 bg-white/[0.14] lg:-right-2.5 lg:block"
                />
              ) : null}
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

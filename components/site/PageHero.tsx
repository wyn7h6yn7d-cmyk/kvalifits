import type { ReactNode } from "react";

import { AmbientBackground } from "@/components/site/AmbientBackground";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

export function PageHero({
  eyebrow,
  title,
  subtitle,
  children,
  prepend,
  ambient = true,
}: {
  eyebrow: string;
  title: string;
  subtitle: ReactNode;
  children?: ReactNode;
  /** Rendered first (e.g. tutorial) — full width above eyebrow/title/subtitle */
  prepend?: ReactNode;
  /** When false, no gradient glow (e.g. employer landing lead strip) */
  ambient?: boolean;
}) {
  return (
    <section
      className={cn("relative overflow-hidden", !ambient && "bg-background")}
    >
      {ambient ? <AmbientBackground intensity="soft" /> : null}
      <Container className="relative">
        <div
          className={cn(
            "pt-10 sm:pt-20 lg:pt-28",
            ambient ? "pb-12 sm:pb-16 lg:pb-20" : "pb-14 sm:pb-20 lg:pb-[6.5rem]",
          )}
        >
          <div className="kf-enter">
            {prepend ? <div className="mb-6 w-full sm:mb-12">{prepend}</div> : null}
            <div className="mx-auto max-w-3xl">
              <div className="text-[13px] font-medium uppercase tracking-wide text-white/60 sm:text-sm">
                {eyebrow}
              </div>
              <h1 className="mt-3 text-balance text-[1.75rem] font-semibold leading-tight tracking-tight text-white sm:mt-5 sm:text-4xl lg:text-5xl">
                {title}
              </h1>
              <p className="mt-3 text-base leading-[1.65] text-white/68 sm:mt-5 sm:text-[1.0625rem] sm:leading-relaxed">
                {subtitle}
              </p>
            </div>
            {children ? <div className="mt-8 w-full sm:mt-10">{children}</div> : null}
          </div>
        </div>
      </Container>
    </section>
  );
}

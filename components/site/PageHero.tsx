import type { ReactNode } from "react";

import { AmbientBackground } from "@/components/site/AmbientBackground";
import { Container } from "@/components/ui/container";
import {
  SITE_EYEBROW,
  SITE_H1_HERO,
  SITE_PAGE_TOP,
  SITE_SECTION_PB,
} from "@/lib/site/publicPageLayout";
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
            SITE_PAGE_TOP,
            ambient ? SITE_SECTION_PB : "pb-14 sm:pb-16 lg:pb-20",
          )}
        >
          <div className="kf-enter">
            {prepend ? <div className="mb-6 w-full sm:mb-8">{prepend}</div> : null}
            <div className="mx-auto max-w-3xl">
              <div className={SITE_EYEBROW}>{eyebrow}</div>
              <h1 className={cn("mt-3 sm:mt-4", SITE_H1_HERO)}>{title}</h1>
              <p className="mt-3 text-base leading-[1.65] text-white/68 sm:mt-4 sm:text-[1.0625rem] sm:leading-relaxed">
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

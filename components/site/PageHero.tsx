import type { ReactNode } from "react";

import { Container } from "@/components/ui/container";
import {
  SITE_BODY_LEAD,
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
  innerClassName,
  titleClassName,
  subtitleClassName,
  ctaClassName,
  sectionClassName,
  contentClassName,
  ctaInsideInner = false,
}: {
  eyebrow: string;
  title: string;
  subtitle: ReactNode;
  children?: ReactNode;
  /** Rendered first (e.g. tutorial) — full width above eyebrow/title/subtitle */
  prepend?: ReactNode;
  innerClassName?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  ctaClassName?: string;
  sectionClassName?: string;
  contentClassName?: string;
  /** When true, CTA sits in the same column as the title (not full container width). */
  ctaInsideInner?: boolean;
}) {
  return (
    <section className={cn("bg-background", sectionClassName)}>
      <Container>
        <div className={cn(SITE_PAGE_TOP, SITE_SECTION_PB, contentClassName)}>
          {prepend ? <div className="mb-6 w-full sm:mb-8">{prepend}</div> : null}
          <div className={cn("mx-auto max-w-3xl", innerClassName)}>
            <div className={SITE_EYEBROW}>{eyebrow}</div>
            <h1 className={cn("mt-4 sm:mt-5", SITE_H1_HERO, titleClassName)}>{title}</h1>
            <p className={cn("mt-5 max-w-[34rem] text-pretty sm:mt-6", SITE_BODY_LEAD, subtitleClassName)}>
              {subtitle}
            </p>
            {ctaInsideInner && children ? (
              <div className={cn("mt-5 sm:mt-6 lg:mt-7", ctaClassName)}>{children}</div>
            ) : null}
          </div>
          {!ctaInsideInner && children ? (
            <div className={cn("mt-8 w-full sm:mt-10", ctaClassName)}>{children}</div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}

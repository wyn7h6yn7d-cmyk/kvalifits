import type { ReactNode } from "react";

import { Container } from "@/components/ui/container";
import {
  SITE_BODY,
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
}: {
  eyebrow: string;
  title: string;
  subtitle: ReactNode;
  children?: ReactNode;
  /** Rendered first (e.g. tutorial) — full width above eyebrow/title/subtitle */
  prepend?: ReactNode;
}) {
  return (
    <section className="bg-background">
      <Container>
        <div className={cn(SITE_PAGE_TOP, SITE_SECTION_PB)}>
          {prepend ? <div className="mb-6 w-full sm:mb-8">{prepend}</div> : null}
          <div className="mx-auto max-w-3xl">
            <div className={SITE_EYEBROW}>{eyebrow}</div>
            <h1 className={cn("mt-3 sm:mt-4", SITE_H1_HERO)}>{title}</h1>
            <p className={cn("mt-4 sm:mt-5", SITE_BODY, "text-muted")}>{subtitle}</p>
          </div>
          {children ? <div className="mt-8 w-full sm:mt-10">{children}</div> : null}
        </div>
      </Container>
    </section>
  );
}

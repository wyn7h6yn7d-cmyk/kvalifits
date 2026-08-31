import type { ReactNode } from "react";

import { Container } from "@/components/ui/container";
import {
  SITE_HOME_INNER,
  SITE_HOME_SECTION,
  SITE_HOME_SECTION_DEEP,
  SITE_HOME_SECTION_RAISED,
} from "@/lib/site/publicPageLayout";
import { cn } from "@/lib/utils";

type Tone = "base" | "raised" | "deep";
type Glow = "none" | "top" | "center";

const TONE_CLASS: Record<Tone, string> = {
  base: SITE_HOME_SECTION,
  raised: SITE_HOME_SECTION_RAISED,
  deep: SITE_HOME_SECTION_DEEP,
};

const GLOW_CLASS: Record<Exclude<Glow, "none">, string> = {
  top: "pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(ellipse_80%_100%_at_50%_0%,rgba(99,102,241,0.09),transparent_72%)]",
  center:
    "pointer-events-none absolute inset-x-0 top-1/2 h-64 -translate-y-1/2 bg-[radial-gradient(ellipse_70%_80%_at_50%_50%,rgba(99,102,241,0.06),transparent_70%)]",
};

type Props = {
  children: ReactNode;
  id?: string;
  tone?: Tone;
  glow?: Glow;
  className?: string;
  containerClassName?: string;
  /** Narrower inner column for text-heavy blocks (FAQ, CTA). */
  narrow?: boolean;
  "aria-labelledby"?: string;
};

export function HomeSectionShell({
  children,
  id,
  tone = "base",
  glow = "none",
  className,
  containerClassName,
  narrow = false,
  "aria-labelledby": ariaLabelledby,
}: Props) {
  return (
    <section id={id} aria-labelledby={ariaLabelledby} className={cn(TONE_CLASS[tone], "overflow-hidden", className)}>
      {glow !== "none" ? <div aria-hidden className={GLOW_CLASS[glow]} /> : null}
      <Container className={cn("relative", containerClassName)}>
        <div className={cn(narrow && SITE_HOME_INNER)}>{children}</div>
      </Container>
    </section>
  );
}

import type { ReactNode } from "react";

import { Container } from "@/components/ui/container";
import {
  SITE_HOME_INNER_CTA,
  SITE_HOME_INNER_FAQ,
  SITE_HOME_SECTION,
} from "@/lib/site/publicPageLayout";
import { cn } from "@/lib/utils";

type Tone = "base" | "raised" | "deep";
type Glow = "none" | "top" | "center";
type ContentWidth = "full" | "cta" | "faq";

/** All tones map to the same canvas — avoids banded section backgrounds. */
const TONE_CLASS: Record<Tone, string> = {
  base: SITE_HOME_SECTION,
  raised: SITE_HOME_SECTION,
  deep: SITE_HOME_SECTION,
};

const CONTENT_WIDTH_CLASS: Record<Exclude<ContentWidth, "full">, string> = {
  cta: SITE_HOME_INNER_CTA,
  faq: SITE_HOME_INNER_FAQ,
};

type Props = {
  children: ReactNode;
  id?: string;
  tone?: Tone;
  /** @deprecated Section-wide glow bands removed — use focal glows in section content. */
  glow?: Glow;
  contentWidth?: ContentWidth;
  className?: string;
  containerClassName?: string;
  /** @deprecated Use contentWidth="cta" | "faq" */
  narrow?: boolean;
  "aria-labelledby"?: string;
};

export function HomeSectionShell({
  children,
  id,
  tone = "base",
  glow: _glow = "none",
  contentWidth = "full",
  className,
  containerClassName,
  narrow = false,
  "aria-labelledby": ariaLabelledby,
}: Props) {
  const width = narrow ? "cta" : contentWidth;

  return (
    <section id={id} aria-labelledby={ariaLabelledby} className={cn(TONE_CLASS[tone], className)}>
      <Container className={cn("relative", containerClassName)}>
        <div className={cn(width !== "full" && CONTENT_WIDTH_CLASS[width])}>{children}</div>
      </Container>
    </section>
  );
}
